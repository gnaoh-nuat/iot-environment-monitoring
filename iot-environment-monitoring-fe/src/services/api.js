import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Response interceptor: Tự động trích xuất data và format lỗi đồng nhất
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Unknown error";

    console.error("API Error:", message);

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  },
);

export default api;
