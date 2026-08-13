import React, { useState, useRef, useEffect } from "react";
import { askQuestion, clearHistory } from "../services/api.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-end gap-2 chat-message">
    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs shrink-0">
      AI
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1 items-center h-4">
        <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
      </div>
    </div>
  </div>
);

// Single chat message bubble
const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-end gap-2 chat-message ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isUser ? "bg-slate-700 text-white" : "bg-primary text-white"
        }`}
      >
        {isUser ? "You" : "AI"}{" "}
      </div>
    
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && message.sourcePDFs && message.sourcePDFs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">Sources:</p>

            <div className="flex flex-wrap gap-1">
              {message.sourcePDFs.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-blue-50 text-primary text-xs px-2 py-0.5 rounded-full"
                >
                  📄 {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {message.createdAt && (
          <p
            className={`text-xs mt-2 ${
              isUser ? "text-blue-200" : "text-slate-300"
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
};

const ChatBox = ({ initialHistory = [] }) => {
  const [messages, setMessages] = useState(() => {
    const historyMessages = [];

    for (const chat of initialHistory) {
      historyMessages.push({
        id: `${chat._id}-q`,
        role: "user",
        content: chat.question,
        createdAt: chat.createdAt,
      });

      historyMessages.push({
        id: `${chat._id}-a`,
        role: "assistant",
        content: chat.answer,
        sourcePDFs: chat.sourcePDFs,
        createdAt: chat.createdAt,
      });
    }

    return historyMessages;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();

    if (!question || loading) return;

    setInput("");
    setError("");

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);

    try {
      const res = await askQuestion(question);

      const { chat } = res.data;

      const assistantMsg = {
        id: `ai-${chat.id}`,
        role: "assistant",
        content: chat.answer,
        sourcePDFs: chat.sourcePDFs,
        createdAt: chat.createdAt,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(msg);

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${msg}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all chat history?")) return;

    try {
      await clearHistory();
      setMessages([]);
    } catch {
      alert("Failed to clear history.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {" "}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-sm font-medium text-slate-700">
            AI Assistant
          </span>
          <span className="text-xs text-slate-400">· Powered by Ollama</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Clear history
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-4xl mb-3">🤖</p>

            <p className="text-sm font-medium text-slate-600">
              Start a conversation
            </p>

            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Ask anything...
            </p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>
      <div className="shrink-0 p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... documents, coding, interview prep, summaries, comparisons, etc."
            rows={1}
            className="flex-1 input-field resize-none min-h-[42px] max-h-32 overflow-y-auto"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="btn-primary shrink-0 h-10 w-10 flex items-center justify-center p-0 rounded-lg"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
