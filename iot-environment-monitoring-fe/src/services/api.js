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
 * Request interceptor
 */
api.interceptors.request.use(
  (config) => {
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
