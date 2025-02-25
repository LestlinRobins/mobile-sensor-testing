import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useEffect } from "react";

function App() {
  const [count, setCount] = useState(0);
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const handleMotion = (event) => {
      if (event.acceleration) {
        setAcceleration({
          x: event.acceleration.x?.toFixed(2),
          y: event.acceleration.y?.toFixed(2),
          z: event.acceleration.z?.toFixed(2),
        });
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);
  const [gravity, setGravity] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if ("GravitySensor" in window) {
      try {
        const sensor = new GravitySensor({ frequency: 60 });
        sensor.addEventListener("reading", () => {
          setGravity({
            x: sensor.x?.toFixed(2),
            y: sensor.y?.toFixed(2),
            z: sensor.z?.toFixed(2),
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
      <div>HI</div>
      <div>
        X: {acceleration.x}, Y: {acceleration.y}, Z: {acceleration.z}
      </div>
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
