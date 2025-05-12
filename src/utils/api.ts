import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.url}`,
      config.data
    );
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Helper function to ensure numeric values
const ensureNumeric = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map((item) => ensureNumeric(item));
  }
  if (data && typeof data === "object") {
    const result = { ...data };
    for (const key in result) {
      // Handle monetary values
      if (
        key === "subtotal" ||
        key === "tax" ||
        key === "total" ||
        key === "unitPrice"
      ) {
        result[key] = parseFloat(Number(result[key] || 0).toFixed(2));
      }
      // Handle quantities as integers with minimum value of 1
      else if (key === "quantity") {
        result[key] = Math.max(1, parseInt(String(result[key])) || 1);
      }
      // Handle items array
      else if (key === "items" && Array.isArray(result[key])) {
        result[key] = result[key].map((item: any) => ({
          ...item,
          quantity: Math.max(1, parseInt(String(item.quantity)) || 1),
          unitPrice: parseFloat(Number(item.unitPrice || 0).toFixed(2)),
          total: parseFloat(
            (
              Math.max(1, parseInt(String(item.quantity)) || 1) *
              Number(item.unitPrice || 0)
            ).toFixed(2)
          ),
        }));
      }
      // Recursively handle nested objects
      else if (typeof result[key] === "object") {
        result[key] = ensureNumeric(result[key]);
      }
    }
    return result;
  }
  return data;
};

// Add response interceptor to handle errors and transform data
api.interceptors.response.use(
  (response) => {
    console.log(`API Response from ${response.config.url}:`, response.data);
    // Transform numeric values in the response data
    if (response.data) {
      response.data = ensureNumeric(response.data);
    }
    return response.data;
  },
  (error) => {
    console.error("API Response Error:", error);
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
      }
      throw error.response.data;
    }
    throw error;
  }
);

export default api;
