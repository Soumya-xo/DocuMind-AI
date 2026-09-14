import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox.jsx";
import { fetchChatHistory, fetchPDFs } from "../services/api.js";
import DocuMindDashboardLayout from "../layouts/DocuMindDashboardLayout.jsx";

const Chat = () => {
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [pdfCount, setPdfCount] = useState(0);
  const [pdfList, setPdfList] = useState([]);
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
      setPdfList(pdfRes.data.pdfs || []);
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
      <div className="max-w-4xl mx-auto w-full h-[calc(100vh-6rem)] flex flex-col px-1 sm:px-2">
        <div className="shrink-0 space-y-3 mb-3">
          {/* No PDFs warning */}
          {pdfCount === 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
              <span className="text-lg shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  No documents uploaded
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">
                  Upload documents before asking questions.{" "}
                  <button
                    onClick={() => navigate("/documents")}
                    className="underline font-medium"
                  >
                    Go to Documents
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Chat box — the only section that scrolls internally */}
        <div className="flex-1 min-h-0 rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
          <ChatBox
            initialHistory={chatHistory}
            pdfs={pdfList}
            pdfCount={pdfCount}
          />
        </div>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default Chat;
