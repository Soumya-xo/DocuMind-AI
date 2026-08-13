import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox.jsx";
import { fetchChatHistory, fetchPDFs } from "../services/api.js";
import DocuMindDashboardLayout from "../layouts/DocuMindDashboardLayout.jsx";

const Chat = () => {
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [pdfCount, setPdfCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [historyRes, pdfRes] = await Promise.all([
        fetchChatHistory(),
        fetchPDFs(),
      ]);
      setChatHistory(historyRes.data.chats || []);
      setPdfCount(pdfRes.data.count || 0);
    } catch (err) {
      setError("Failed to load chat data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DocuMindDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-primary mx-auto"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm text-slate-400 mt-3">Loading chat...</p>
          </div>
        </div>
      </DocuMindDashboardLayout>
    );
  }

  return (
    <DocuMindDashboardLayout>
      <div className="max-w-4xl mx-auto w-full px-1 sm:px-2">
        {/* No PDFs warning */}
        {pdfCount === 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">
                No PDFs uploaded
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                You need to upload PDFs before asking questions.{" "}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="underline font-medium"
                >
                  Go to Dashboard
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* PDF info bar */}
        {pdfCount > 0 && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 bg-white rounded-lg border border-slate-100 px-3 py-2">
            <span>📚</span>
            <span>
              Searching across{" "}
              <strong className="text-primary">
                {pdfCount} PDF{pdfCount > 1 ? "s" : ""}
              </strong>{" "}
              in your knowledge base
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="ml-auto text-primary hover:underline"
            >
              Manage
            </button>
          </div>
        )}

        {/* Chat box */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
          <ChatBox initialHistory={chatHistory} />
        </div>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default Chat;
