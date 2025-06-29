import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";

const ApiDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDebugInfo({
      API_BASE_URL,
      finalApiUrl: `${API_BASE_URL}/api`,
      envMode: import.meta.env.MODE,
      envViteApiUrl: import.meta.env.VITE_API_URL,
      hostname: window.location.hostname,
      href: window.location.href,
      pathname: window.location.pathname,
      mounted: true,
      timestamp: new Date().toISOString(),
    });
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          background: "red",
          color: "white",
          padding: "10px",
        }}
      >
        Loading Debug...
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: "10px",
        fontSize: "11px",
        zIndex: 9999,
        maxWidth: "350px",
        maxHeight: "400px",
        overflow: "auto",
        border: "2px solid #00ff00",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0", color: "#00ff00" }}>API Debug Info</h4>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default ApiDebug;
