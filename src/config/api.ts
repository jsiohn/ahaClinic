// Get the API base URL based on environment
const getApiBaseUrl = () => {
  // First check for explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check if we're in production mode
  if (
    import.meta.env.MODE === "production" ||
    window.location.hostname !== "localhost"
  ) {
    return "https://ahaclinic-backend.onrender.com";
  }

  // Default to localhost for development
  return "http://localhost:5000";
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging in development
if (import.meta.env.DEV) {
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("Environment mode:", import.meta.env.MODE);
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("Window location:", window.location.hostname);
}

export default API_BASE_URL;
