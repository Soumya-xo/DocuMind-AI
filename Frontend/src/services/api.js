import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Create Axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);

// ── PDFs ──────────────────────────────────────────────
export const uploadPDFs = (formData) =>
  api.post("/pdf/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const fetchPDFs = () => api.get("/pdf/list");

export const deletePDF = (id) => api.delete(`/pdf/${id}`);

export const viewDocument = (id) => api.get(`/pdf/view/${id}`);

export const downloadDocument = (id) =>
  api.get(`/pdf/download/${id}`, {
    responseType: "blob",
  });

// ── Chat ──────────────────────────────────────────────
export const askQuestion = (question) => api.post("/chat/ask", { question });
export const fetchChatHistory = () => api.get("/chat/history");
export const clearHistory = () => api.delete("/chat/history");

export default api;
