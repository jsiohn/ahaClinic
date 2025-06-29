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

export default API_BASE_URL;
