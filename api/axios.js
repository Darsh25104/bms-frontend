import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://blood-management-system-6v69.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_URL,
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = token; // backend expects raw token, no "Bearer " prefix
  }
  return config;
});

// Auto logout on invalid/expired token
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
