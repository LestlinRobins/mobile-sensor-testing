import { useState, useRef } from "react";
import { useEffect } from "react";
import supabase from "./supabase";

function App() {
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [alarm, setAlarm] = useState("");
  const [gravity, setGravity] = useState({ x: 0, y: 0, z: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Audio recording references
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Initialize audio recording
  useEffect(() => {
    async function setupAudioRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          audioChunksRef.current = [];
          await uploadAudioToSupabase(audioBlob);
          setIsRecording(false);
        };

        // Start continuous recording with a 10-second buffer
        startContinuousRecording();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }

    setupAudioRecording();

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Function to handle continuous recording with a 10-second buffer
  const startContinuousRecording = () => {
    if (!mediaRecorderRef.current) return;

    const timeSlice = 1000; // 1 second chunks
    audioChunksRef.current = [];
    mediaRecorderRef.current.start(timeSlice);

    // Keep only the last 10 seconds of audio in the buffer
    setInterval(() => {
      if (audioChunksRef.current.length > 10) {
        audioChunksRef.current = audioChunksRef.current.slice(-10);
      }
    }, timeSlice);
  };

  // Function to upload audio to Supabase
  const uploadAudioToSupabase = async (audioBlob) => {
    try {
      setUploadStatus("Uploading audio...");

      // Create a unique filename
      const fileName = `crash_audio_${Date.now()}.webm`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("crash-recordings")
        .upload(fileName, audioBlob);

      if (error) {
        throw error;
      }

      // Get the URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("crash-recordings")
        .getPublicUrl(fileName);

      const audioUrl = urlData.publicUrl;

      // Insert record into database
      const { error: dbError } = await supabase.from("crash_incidents").insert({
        latitude: window.lastCrashLocation?.latitude || null,
        longitude: window.lastCrashLocation?.longitude || null,
        audio_url: audioUrl,
      });

      if (dbError) {
        throw dbError;
      }

      setUploadStatus("Audio uploaded successfully!");
      setTimeout(() => setUploadStatus(""), 5000);
    } catch (error) {
      console.error("Error uploading to Supabase:", error);
      setUploadStatus("Failed to upload audio");
    }
  };

  useEffect(() => {
    const handleMotion = (event) => {
      if (event.acceleration) {
        const newAcceleration = {
          x: parseFloat(event.acceleration.x?.toFixed(2)),
          y: parseFloat(event.acceleration.y?.toFixed(2)),
          z: parseFloat(event.acceleration.z?.toFixed(2)),
        };
        setAcceleration(newAcceleration);

        // Check for crash
        if (
          Math.abs(newAcceleration.x) > 25 ||
          Math.abs(newAcceleration.y) > 25 ||
          Math.abs(newAcceleration.z) > 25
        ) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              // Store location for upload
              window.lastCrashLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              alert(
                `Sudden change detected! Current location: Latitude ${position.coords.latitude}, Longitude ${position.coords.longitude}`
              );

              // Save the current recording (stops current recorder and triggers upload)
              if (mediaRecorderRef.current && !isRecording) {
                setIsRecording(true);
                mediaRecorderRef.current.stop();

                // Restart recording after a brief pause
                setTimeout(() => {
                  startContinuousRecording();
                }, 500);
              }
            },
            (error) => {
              console.error("Error getting location:", error);
            }
          );
          setAlarm("Alarm sounded");
        }
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isRecording]);

  useEffect(() => {
    if ("GravitySensor" in window) {
      try {
        const sensor = new GravitySensor({ frequency: 60 });
        sensor.addEventListener("reading", () => {
          setGravity({
            x: parseFloat(sensor.x?.toFixed(2)),
            y: parseFloat(sensor.y?.toFixed(2)),
            z: parseFloat(sensor.z?.toFixed(2)),
          });
        });
        sensor.start();
      } catch (error) {
        console.error("Gravity Sensor error:", error);
      }
    } else {
      console.warn("Gravity Sensor API not supported in this browser.");
    }
  }, []);

  return (
    <>
      <div>HI there</div>
      <div>
        X: {acceleration.x}, Y: {acceleration.y}, Z: {acceleration.z}
      </div>
      <p>{alarm}</p>
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Live Gravity Sensor Data</h1>
        <p>Gravity X: {gravity.x} m/s²</p>
        <p>Gravity Y: {gravity.y} m/s²</p>
        <p>Gravity Z: {gravity.z} m/s²</p>
        {uploadStatus && <p className="mt-4 text-blue-600">{uploadStatus}</p>}
      </div>
    </>
  );
}

export default App;
