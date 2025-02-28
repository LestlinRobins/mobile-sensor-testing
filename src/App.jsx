import { useState } from "react";
import { useEffect } from "react";

function App() {
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [alarm, setAlarm] = useState("");
  const [gravity, setGravity] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const handleMotion = (event) => {
      if (event.acceleration) {
        const newAcceleration = {
          x: parseFloat(event.acceleration.x?.toFixed(2)),
          y: parseFloat(event.acceleration.y?.toFixed(2)),
          z: parseFloat(event.acceleration.z?.toFixed(2)),
        };
        setAcceleration(newAcceleration);

        if (
          Math.abs(newAcceleration.x) > 50 ||
          Math.abs(newAcceleration.y) > 50 ||
          Math.abs(newAcceleration.z) > 50
        ) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              alert(
                `Sudden change detected! Current location: Latitude ${position.coords.latitude}, Longitude ${position.coords.longitude}`
              );
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
  }, []);

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
      </div>
    </>
  );
}

export default App;
