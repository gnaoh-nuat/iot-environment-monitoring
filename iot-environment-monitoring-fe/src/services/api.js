import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * Axios instance với default config
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor - thêm token, log request
 */
api.interceptors.request.use(
  (config) => {
    // Get token từ localStorage nếu có
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor - handle error, refresh token, etc
 */
api.interceptors.response.use(
  (response) => {
    return response.data; // Trả về data trực tiếp thay vì response envelope
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login"; // Khi có auth page
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Unknown error";

    console.error("API Error:", errorMessage);

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
  },
);

export default api;
