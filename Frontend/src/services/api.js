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

export const viewDocument = (id) =>
  api.get(`/pdf/view/${id}`, {
    responseType: "blob",
  });

export const downloadDocument = (id) =>
  api.get(`/pdf/download/${id}`, {
    responseType: "blob",
  });

// Rebuilds the FAISS index for the currently active embedding provider from
// documents already stored in MongoDB — no re-upload needed. Explicit/
// on-demand only; never called automatically.
export const reindexDocuments = () => api.post("/pdf/reindex");

// ── Chat ──────────────────────────────────────────────
export const askQuestion = (question, documentIds = []) =>
  api.post("/chat/ask", { question, documentIds });

// Streaming text/document chat. Uses raw fetch (not the axios instance
// above) because the browser needs a readable response-body stream to
// consume Server-Sent Events progressively — axios's browser adapter
// doesn't expose that. Auth/401-handling is replicated manually here to
// match the axios interceptors above, since this bypasses them entirely.
//
// Calls onChunk(text) for each streamed piece of the answer, onDone(payload)
// exactly once when the stream completes successfully (payload: { chatId,
// sourcePDFs, sources, documentIds, createdAt }), or onError(message) if the
// request fails outright or fails partway through streaming.
export const askQuestionStream = async (
  question,
  documentIds = [],
  { onChunk, onDone, onError, signal } = {},
) => {
  const token = localStorage.getItem("token");

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/chat/ask-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question, documentIds }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") return;
    onError?.(err.message || "Network error. Please try again.");
    return;
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  if (!response.ok || !response.body) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // Non-JSON error body — keep the default message.
    }
    onError?.(message);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line; a single read() can
      // contain zero, one, or several complete frames, so drain all of
      // them and leave any trailing partial frame in the buffer.
      let sepIndex;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        let eventType = "message";
        let dataStr = "";
        for (const line of rawEvent.split("\n")) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
        }
        if (!dataStr) continue;

        let payload;
        try {
          payload = JSON.parse(dataStr);
        } catch {
          continue;
        }

        if (eventType === "chunk") onChunk?.(payload.text);
        else if (eventType === "done") onDone?.(payload);
        else if (eventType === "error") onError?.(payload.message);
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    onError?.(err.message || "Connection lost. Please try again.");
  }
};

export const askImageQuestion = (question, documentIds = [], imageFile) => {
  const formData = new FormData();
  formData.append("question", question);
  formData.append("documentIds", JSON.stringify(documentIds));
  formData.append("image", imageFile);

  return api.post("/chat/ask-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const fetchChatHistory = () => api.get("/chat/history");
export const clearHistory = () => api.delete("/chat/history");

export default api;
