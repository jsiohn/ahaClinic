import { useEffect, useState } from "react";
import { Button, Box, Typography, Paper, Alert } from "@mui/material";
import API_BASE_URL from "../config/api";
import api from "../utils/api";

const ApiDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [mounted, setMounted] = useState(false);
  const [dbResults, setDbResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  const checkDatabase = async () => {
    setLoading(true);
    try {
      console.log("=== CHECKING DATABASE ===");

      // Check clients
      const clientsResponse = await api.get("/clients");
      console.log("Clients response:", clientsResponse.data);

      // Check blacklist
      const blacklistResponse = await api.get("/blacklist");
      console.log("Blacklist response:", blacklistResponse.data);

      const clientsData = Array.isArray(clientsResponse.data)
        ? clientsResponse.data
        : [];
      const blacklistData = Array.isArray(blacklistResponse.data)
        ? blacklistResponse.data
        : [];

      const blacklistedClients = clientsData.filter(
        (client: any) => client.isBlacklisted
      );

      setDbResults({
        totalClients: clientsData.length,
        blacklistedClientsInClientCollection: blacklistedClients.length,
        blacklistedClients: blacklistedClients.map((c: any) => ({
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          reason: c.blacklistReason,
          isBlacklisted: c.isBlacklisted,
        })),
        blacklistCollectionEntries: blacklistData.length,
        blacklistEntries: blacklistData,
      });
    } catch (error) {
      console.error("Error checking database:", error);
      setDbResults({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

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
      <Button
        variant="contained"
        onClick={checkDatabase}
        disabled={loading}
        style={{
          marginTop: "10px",
          backgroundColor: "#00ff00",
          color: "black",
        }}
      >
        {loading ? "Checking..." : "Check Database"}
      </Button>
      {dbResults && (
        <Box
          component={Paper}
          elevation={3}
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {dbResults.error ? (
            <Alert severity="error">{dbResults.error}</Alert>
          ) : (
            <>
              <Typography variant="body2" color="inherit">
                Total Clients: {dbResults.totalClients}
              </Typography>
              <Typography variant="body2" color="inherit">
                Blacklisted Clients in Client Collection:{" "}
                {dbResults.blacklistedClientsInClientCollection}
              </Typography>
              <Typography variant="body2" color="inherit">
                Blacklist Collection Entries:{" "}
                {dbResults.blacklistCollectionEntries}
              </Typography>
              <Typography variant="body2" color="inherit">
                Blacklist Entries: {dbResults.blacklistEntries.length}
              </Typography>
            </>
          )}
        </Box>
      )}
    </div>
  );
};

export default ApiDebug;
