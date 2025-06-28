const API_BASE_URL = import.meta.env.PROD
  ? "https://ahaclinic-backend.onrender.com/api" // Replace with your actual backend URL
  : "http://localhost:5000/api";

export { API_BASE_URL };
