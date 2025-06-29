import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";

const ApiDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    setDebugInfo({
      API_BASE_URL,
      finalApiUrl: `${API_BASE_URL}/api`,
      envMode: import.meta.env.MODE,
      envViteApiUrl: import.meta.env.VITE_API_URL,
      hostname: window.location.hostname,
      href: window.location.href,
    });
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <h4>API Debug Info</h4>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};

export default ApiDebug;
