import axios, { AxiosInstance, AxiosRequestConfig, ResponseType } from "axios";
import API_BASE_URL from "../config/api";

const API_URL = `${API_BASE_URL}/api`;

// Type imports will be added when we use them
interface UserProfile {
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "staff" | "user";
    lastLogin?: Date;
    createdAt: Date;
    mustChangePassword?: boolean;
  };
  permissions: string[];
}

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "staff" | "user";
  };
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
}) as AxiosInstance & {
  uploadFile: (
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ) => Promise<any>;
  downloadFile: (
    url: string,
    responseType?: ResponseType,
    config?: AxiosRequestConfig
  ) => Promise<any>;
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
      if (key === "subtotal" || key === "total" || key === "unitPrice") {
        const numValue = Number(result[key]);
        result[key] = isNaN(numValue) ? 0 : parseFloat(numValue.toFixed(2));
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
          unitPrice: parseFloat(
            (isNaN(Number(item.unitPrice))
              ? 0
              : Number(item.unitPrice)
            ).toFixed(2)
          ),
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
    // Transform numeric values in the response data
    if (response.data) {
      response.data = ensureNumeric(response.data);
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      if (
        error.response.status === 401 &&
        !window.location.pathname.includes("/auth")
      ) {
        // Only clear token and redirect if we're not on the auth page
        // This prevents login errors from causing a redirect/refresh
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
      }
      throw error.response.data;
    }
    throw error;
  }
);

// Custom API method to handle file uploads
const uploadFile = async (
  url: string,
  formData: FormData,
  config: AxiosRequestConfig = {}
) => {
  try {
    const token = localStorage.getItem("token");
    const requestConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...(config.headers || {}),
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    };
    const response = await axios.post(
      `${API_URL}${url}`,
      formData,
      requestConfig
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Custom API method to download files
const downloadFile = async (
  url: string,
  responseType: ResponseType = "arraybuffer",
  config: AxiosRequestConfig = {}
) => {
  try {
    const token = localStorage.getItem("token");
    const requestConfig: AxiosRequestConfig = {
      ...config,
      responseType,
      headers: {
        ...(config.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
      },
    };

    const response = await axios.get(`${API_URL}${url}`, requestConfig);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add the methods to the api object
api.uploadFile = uploadFile;
api.downloadFile = downloadFile;

// Auth-related API functions
export const authApi = {
  // Get current user profile and permissions
  getProfile: async (): Promise<UserProfile> => {
    const data = (await api.get("/auth/me")) as UserProfile;
    return data; // Response interceptor already returns response.data
  },

  // Login user
  login: async (credentials: {
    username: string;
    password: string;
  }): Promise<LoginResponse> => {
    const data = (await api.post("/auth/login", credentials)) as LoginResponse;
    return data; // Response interceptor already returns response.data
  },

  // Register user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    const data = await api.post("/auth/register", userData);
    return data; // Response interceptor already returns response.data
  },

  // Logout user
  logout: async () => {
    const data = await api.post("/auth/logout");
    return data; // Response interceptor already returns response.data
  },
};

export default api;
