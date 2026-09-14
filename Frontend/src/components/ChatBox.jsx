import React, { useState, useRef, useEffect } from "react";
import {
  askQuestionStream,
  askImageQuestion,
  clearHistory,
} from "../services/api.js";
import { viewPDFFile } from "../utils/documentActions.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  ChevronDown,
  Check,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Copy,
  Paperclip,
  Pencil,
  RotateCcw,
  Mic,
  MicOff,
  X,
  ExternalLink,
} from "lucide-react";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // Mirrors the backend's multer limit (see chatRoutes.js)

// Browser-native speech recognition — no backend/dependency involved.
// Feature-detected once at module load; if unsupported, the mic button is
// simply not rendered (a disabled decoy button would itself be exactly the
// kind of "looks clickable but isn't" bug this feature must avoid).
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-end gap-2 chat-message">
    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs shrink-0">
      AI
    </div>
    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1 items-center h-4">
        <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
      </div>
    </div>
  </div>
);

// Compact "Chat with [ All Documents ▾ ]" dropdown letting the user scope
// the next question to All Documents, one document, or several at once.
// Selection semantics are unchanged: selectedIds = [] means "All Documents";
// a non-empty array restricts retrieval to those IDs.
const DocumentScopeSelector = ({ pdfs, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!pdfs || pdfs.length === 0) return null;

  const isAll = selectedIds.length === 0;

  const toggleDoc = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedNames = pdfs
    .filter((pdf) => selectedIds.includes(pdf._id))
    .map((pdf) => pdf.originalName);

  const label = isAll
    ? "All Documents"
    : selectedIds.length === 1
      ? selectedNames[0]
      : `${selectedIds.length} documents`;

  return (
    <div
      ref={containerRef}
      className="relative px-4 py-2.5 bg-white dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 shrink-0"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Chat with
        </span>

        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 pl-3 pr-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-primary/50 transition-colors max-w-[220px]"
          title={isAll ? "All Documents" : selectedNames.join(", ")}
        >
          <span className="truncate">{label}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {!isAll && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-slate-400 hover:text-primary underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 left-4 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5">
          <button
            onClick={() => {
              onChange([]);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition-colors ${
              isAll
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            All Documents
            {isAll && <Check className="h-4 w-4 shrink-0" />}
          </button>

          <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

          {pdfs.map((pdf) => {
            const active = selectedIds.includes(pdf._id);

            return (
              <button
                key={pdf._id}
                onClick={() => toggleDoc(pdf._id)}
                title={pdf.originalName}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="truncate flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{pdf.originalName}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Compact icon-first action button used for Copy/Edit/Regenerate. Always
// rendered (not hover-only), so it works identically on touch devices —
// subtle styling keeps it visually secondary to the conversation itself.
const MessageAction = ({ icon: Icon, label, onClick, active, activeLabel }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
    aria-label={active ? activeLabel : label}
  >
    <Icon className="h-3.5 w-3.5" />
    <span>{active ? activeLabel : label}</span>
  </button>
);

// Single chat message bubble
const ChatMessage = ({
  message,
  copied,
  onCopy,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerate,
  onOpenSource,
}) => {
  const isUser = message.role === "user";
  const editTextareaRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      editTextareaRef.current?.focus();
      editTextareaRef.current?.setSelectionRange(
        editValue.length,
        editValue.length,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

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
        {isUser ? "You" : "AI"}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-100 rounded-bl-sm"
        }`}
      >
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={editTextareaRef}
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={2}
              className="w-full resize-none rounded-xl border border-white/30 bg-white/10 px-2.5 py-2 text-sm text-white placeholder:text-blue-100 outline-none focus:ring-2 focus:ring-white/40"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancelEdit}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-100 hover:bg-white/10 transition-colors"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
              <button
                onClick={onSaveEdit}
                disabled={!editValue.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <Send className="h-3 w-3" /> Send
              </button>
            </div>
          </div>
        ) : (
          <>
            {isUser && message.image && (
              <img
                src={message.image}
                alt={message.imageName || "Attached image"}
                className="mb-2 max-h-48 w-auto rounded-xl border border-white/20 object-cover"
              />
            )}

            {isUser && !message.image && message.hasImage && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs text-blue-100">
                <ImageIcon className="h-3.5 w-3.5" />
                Image attached
              </div>
            )}

            {isUser ? (
              message.content ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : null
            ) : message.isStreaming && !message.content ? (
              // Waiting for the first token — same dot animation as the
              // (now-suppressed, for this message) global TypingIndicator,
              // shown inline so this specific bubble reflects its own state.
              <div className="flex gap-1 items-center h-4">
                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-4 w-1.5 align-text-bottom bg-primary/70 animate-pulse"
                  />
                )}
              </div>
            )}

            {!isUser && message.sources && message.sources.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1.5">
                  Sources
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {message.sources.map((source, i) =>
                    source.documentId ? (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onOpenSource(source)}
                        title={`Open ${source.fileName}${source.pageNumber != null ? ` at page ${source.pageNumber}` : ""}`}
                        aria-label={`Open ${source.fileName}${source.pageNumber != null ? `, page ${source.pageNumber}` : ""}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary-light/60 dark:bg-primary/10 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary-light dark:hover:bg-primary/20 hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        <span>
                          {source.fileName}
                          {source.pageNumber != null
                            ? ` — Page ${source.pageNumber}`
                            : ""}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </button>
                    ) : (
                      // No documentId to resolve (shouldn't normally happen
                      // for freshly-generated sources) — show as plain,
                      // non-clickable, exactly like the sourcePDFs fallback.
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-primary-light/60 dark:bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg"
                      >
                        <FileText className="h-3 w-3" />
                        {source.fileName}
                        {source.pageNumber != null
                          ? ` — Page ${source.pageNumber}`
                          : ""}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : (
              // Fallback for chat history created before structured `sources`
              // existed — those rows only have the flat filename list.
              !isUser &&
              message.sourcePDFs &&
              message.sourcePDFs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1.5">
                    Sources
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {message.sourcePDFs.map((name, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-primary-light/60 dark:bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg"
                      >
                        <FileText className="h-3 w-3" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}

            {message.createdAt && (
              <p
                className={`text-xs mt-2 ${
                  isUser ? "text-blue-200" : "text-slate-300 dark:text-slate-600"
                }`}
              >
                {new Date(message.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {message.regenerated ? " · Regenerated" : ""}
              </p>
            )}

            {/* Compact, always-visible (not hover-only) action row */}
            <div
              className={`mt-2 flex items-center gap-1 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {isUser ? (
                <>
                  <button
                    onClick={() => onStartEdit(message)}
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Edit message"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  {message.content && (
                    <button
                      onClick={() => onCopy(message.id, message.content)}
                      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label={copied ? "Copied" : "Copy message"}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </>
              ) : (
                !message.isStreaming && (
                  <>
                    <MessageAction
                      icon={copied ? Check : Copy}
                      label="Copy"
                      activeLabel="Copied"
                      active={copied}
                      onClick={() => onCopy(message.id, message.content)}
                    />
                    {message.question && !message.hasImage && (
                      <MessageAction
                        icon={RotateCcw}
                        label="Regenerate"
                        onClick={() => onRegenerate(message.question)}
                      />
                    )}
                  </>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ChatBox = ({ initialHistory = [], pdfs = [], pdfCount = 0 }) => {
  const [messages, setMessages] = useState(() => {
    const historyMessages = [];

    for (const chat of initialHistory) {
      // "(image message)" is the backend's placeholder for an image sent
      // with no typed text (see chatController.askImageQuestion) — show it
      // as an empty bubble with just the "Image attached" chip instead of
      // that literal placeholder string.
      const isImagePlaceholder =
        chat.hasImage && chat.question === "(image message)";

      historyMessages.push({
        id: `${chat._id}-q`,
        role: "user",
        content: isImagePlaceholder ? "" : chat.question,
        hasImage: chat.hasImage,
        createdAt: chat.createdAt,
      });

      historyMessages.push({
        id: `${chat._id}-a`,
        role: "assistant",
        content: chat.answer,
        sourcePDFs: chat.sourcePDFs,
        sources: chat.sources,
        question: chat.question,
        hasImage: chat.hasImage,
        createdAt: chat.createdAt,
      });
    }

    return historyMessages;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Empty array = "All Documents" (existing unfiltered behavior).
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);

  // Pending image attachment: { file: File, previewUrl: dataURL, name } | null
  const [pendingImage, setPendingImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // id of the assistant message currently being streamed into, or null.
  // Lets the generic TypingIndicator step aside in favor of that message's
  // own inline indicator, and lets us abort the fetch on unmount.
  const [streamingId, setStreamingId] = useState(null);
  const streamAbortRef = useRef(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Auto-grow the composer textarea up to a reasonable max height, then let
  // it scroll internally (matches the existing max-h-32 overflow-y-auto).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);


  // If a previously-selected document was deleted (no longer in the pdfs
  // list), drop it from the selection instead of silently sending a stale ID.
  useEffect(() => {
    if (selectedDocIds.length === 0) return;

    const availableIds = new Set(pdfs.map((pdf) => pdf._id));
    const stillValid = selectedDocIds.filter((id) => availableIds.has(id));

    if (stillValid.length !== selectedDocIds.length) {
      setSelectedDocIds(stillValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfs]);

  // Stop any in-progress recognition on unmount.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Abort any in-flight stream on unmount so a background fetch never tries
  // to update state after this component is gone.
  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  // Core send/regenerate path — the composer and Regenerate both reuse this
  // exact function, so there's no second code path hitting the API. Returns
  // true/false so callers can decide whether to clear the composer (text +
  // any pending image) — only on success, so a failed send preserves both.
  //
  // Image questions still use a single non-streaming request (unchanged).
  // Text/document questions stream progressively into a placeholder
  // assistant message created up front, so exactly one assistant message is
  // ever added per call regardless of streaming.
  const submitQuestion = async (
    questionText,
    { showUserBubble = true, regenerated = false, image = null } = {},
  ) => {
    if ((!questionText && !image) || loading) return false;

    setError("");

    if (showUserBubble) {
      const userMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        content: questionText,
        image: image ? image.previewUrl : undefined,
        imageName: image ? image.name : undefined,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setLoading(true);

    if (image) {
      try {
        const res = await askImageQuestion(questionText, selectedDocIds, image.file);
        const { chat } = res.data;

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${chat.id}-${Date.now()}`,
            role: "assistant",
            content: chat.answer,
            sourcePDFs: chat.sourcePDFs,
            sources: chat.sources,
            question: questionText,
            regenerated,
            hasImage: true,
            createdAt: chat.createdAt,
          },
        ]);
        return true;
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
        return false;
      } finally {
        setLoading(false);
      }
    }

    // Text/document chat — streamed progressively into one placeholder
    // message, created now and updated in place as chunks arrive.
    const assistantId = `ai-stream-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        question: questionText,
        regenerated,
        isStreaming: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    setStreamingId(assistantId);

    const controller = new AbortController();
    streamAbortRef.current = controller;

    return new Promise((resolve) => {
      let settled = false;

      const finish = (success) => {
        if (settled) return;
        settled = true;
        setLoading(false);
        setStreamingId(null);
        streamAbortRef.current = null;
        resolve(success);
      };

      const handleStreamError = (msg) => {
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `⚠️ ${msg}`,
                  isStreaming: false,
                  sources: undefined,
                  sourcePDFs: undefined,
                }
              : m,
          ),
        );
        finish(false);
      };

      askQuestionStream(questionText, selectedDocIds, {
        signal: controller.signal,
        onChunk: (text) => {
          if (!text) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + text } : m,
            ),
          );
        },
        onDone: (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    sourcePDFs: payload?.sourcePDFs,
                    sources: payload?.sources,
                    isStreaming: false,
                    createdAt: payload?.createdAt || m.createdAt,
                  }
                : m,
            ),
          );
          finish(true);
        },
        onError: handleStreamError,
      }).catch((err) => {
        // Defensive only — askQuestionStream routes its own failures through
        // onError, but a stream must never leave the UI stuck mid-loading.
        handleStreamError(err?.message || "Something went wrong. Please try again.");
      });
    });
  };

  const validateAndSetImage = (file) => {
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only PNG, JPG, and WEBP images are supported.");
      setTimeout(() => setImageError(""), 3000);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("Image is too large. Maximum size is 8MB.");
      setTimeout(() => setImageError(""), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageError("");
      setPendingImage({
        file,
        previewUrl: reader.result,
        name: file.name,
      });
    };
    reader.onerror = () => {
      setImageError("Couldn't read that image. Please try again.");
      setTimeout(() => setImageError(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetImage(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setPendingImage(null);
    setImageError("");
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          // Only intercept when the clipboard actually holds image data —
          // normal text paste is left completely alone.
          e.preventDefault();
          validateAndSetImage(file);
        }
        return;
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    validateAndSetImage(file);
  };

  const handleSend = async () => {
    // Capture the text/image being sent, then clear the composer
    // immediately (ChatGPT-style) — the request below uses these captured
    // copies, not the (now-cleared) live input/pendingImage state.
    const question = input.trim();
    const image = pendingImage;
    if ((!question && !image) || loading) return;

    setInput("");
    setPendingImage(null);

    const ok = await submitQuestion(question, {
      showUserBubble: true,
      image,
    });

    if (ok) {
      textareaRef.current?.focus();
      return;
    }

    // Failed — restore what was cleared so the user doesn't lose it. Use
    // functional updates and only fill in if the field is still empty, so
    // we don't clobber anything the user already started typing/attaching
    // while this request was in flight.
    setInput((current) => (current ? current : question));
    setPendingImage((current) => (current ? current : image));
  };

  const handleRegenerate = (question) => {
    submitQuestion(question, { showUserBubble: false, regenerated: true });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape" && pendingImage) {
      e.preventDefault();
      handleRemoveImage();
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

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1500);
    } catch {
      // Clipboard API unavailable (very old browser / insecure context) —
      // fail silently rather than crash the app.
    }
  };

  // Opens a citation at its cited page. Reuses the existing, already-secure
  // view endpoint (auth + ownership enforced server-side in
  // pdfController.viewDocument) — this never introduces a new document
  // access path. Page navigation only applies to actual PDFs; other
  // formats, or a citation with no page number, just open normally.
  const handleOpenSource = (source) => {
    if (!source?.documentId) return;
    viewPDFFile(source.documentId, { pageNumber: source.pageNumber });
  };

  const handleStartEdit = (message) => {
    setEditingId(message.id);
    setEditValue(message.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = () => {
    const text = editValue.trim();
    setEditingId(null);
    setEditValue("");
    if (!text) return;
    // Kept simple per spec: the edited question is resent through the
    // existing send flow as a new turn, rather than mutating history in
    // place — no new backend endpoint, no destructive history rewrite.
    submitQuestion(text, { showUserBubble: true });
  };

  const toggleMic = () => {
    if (!SpeechRecognitionAPI) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setMicError("");
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      // Populates the existing input — never auto-sends, so the user can
      // still review/edit the transcription before sending.
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = () => {
      setListening(false);
      setMicError("Voice input isn't supported in this browser.");
      setTimeout(() => setMicError(""), 3000);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            AI Assistant
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
            · {pdfCount > 0 ? `${pdfCount} document${pdfCount > 1 ? "s" : ""} indexed` : "Powered by Ollama"}
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <DocumentScopeSelector
        pdfs={pdfs}
        selectedIds={selectedDocIds}
        onChange={setSelectedDocIds}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary-light/70 dark:bg-primary/15 flex items-center justify-center text-primary mb-3">
              <Sparkles className="h-6 w-6" />
            </div>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Start a conversation
            </p>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              Ask anything about your documents, or pick a specific one above.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              copied={copiedId === msg.id}
              onCopy={handleCopy}
              isEditing={editingId === msg.id}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onRegenerate={handleRegenerate}
              onOpenSource={handleOpenSource}
            />
          ))
        )}

        {/* The streaming path shows its own inline indicator on the
            in-progress assistant bubble (see ChatMessage) — this generic
            one is only for the non-streaming image-chat wait. */}
        {loading && !streamingId && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 p-3 sm:p-4 bg-white dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/60">
        {micError && (
          <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
            {micError}
          </p>
        )}
        {imageError && (
          <p className="mb-2 text-xs text-red-500 dark:text-red-400">
            {imageError}
          </p>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border bg-slate-50 dark:bg-slate-900/60 px-2 py-2 transition-shadow focus-within:ring-4 focus-within:ring-primary/15 focus-within:border-primary/40 ${
            isDragOver
              ? "border-primary border-dashed ring-4 ring-primary/15"
              : "border-slate-200 dark:border-slate-700"
          }`}
        >
          {pendingImage && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-2 py-1.5 max-w-fit">
              <img
                src={pendingImage.previewUrl}
                alt={pendingImage.name}
                className="h-9 w-9 rounded-lg object-cover shrink-0"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[10rem]">
                {pendingImage.name}
              </span>
              <button
                onClick={handleRemoveImage}
                className="shrink-0 rounded-full p-0.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Remove attachment"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors"
              aria-label="Attach image"
              title="Attach image"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                pendingImage
                  ? "Ask something about this image..."
                  : "Ask anything about your documents..."
              }
              rows={1}
              className="flex-1 resize-none bg-transparent border-none outline-none min-h-[26px] max-h-32 overflow-y-auto py-1 px-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />

            {SpeechRecognitionAPI && (
              <button
                onClick={toggleMic}
                className={`shrink-0 h-9 w-9 flex items-center justify-center rounded-xl transition-colors ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70"
                }`}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={listening ? "Listening… click to stop" : "Voice input"}
              >
                {listening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={(!input.trim() && !pendingImage) || loading}
              className="btn-primary shrink-0 h-9 w-9 flex items-center justify-center p-0 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
