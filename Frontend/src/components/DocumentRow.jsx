import React from "react";
import { motion } from "framer-motion";
import { Eye, Download, Trash2, FileText } from "lucide-react";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
};

const typeFromName = (name = "") => {
  const ext = name.split(".").pop()?.toUpperCase() || "";
  return ext || "FILE";
};

/**
 * Responsive document row.
 *
 * The one-line vs. two-line switch below is driven by a CSS container query
 * on this row's own wrapper (see .document-row-container / .document-row-
 * inline / .document-row-stacked in index.css), not a viewport breakpoint.
 * This component is reused both on the full-width Documents page and
 * squeezed into a half-width Dashboard column, so its actual rendered width
 * varies independently of viewport size — a container query reacts to that
 * real width directly instead of guessing from the screen size.
 *
 * Wide enough (roughly >=560px of actual row width): everything on one
 * line — icon, filename (flexible, gets the remaining space),
 * type/size/pages/date, actions.
 *
 * Narrower than that: a genuine two-line layout — line 1 is ONLY the icon +
 * filename, so nothing ever competes with the filename for space; line 2
 * holds the compact metadata + actions.
 */
const DocumentRow = ({ pdf, onView, onDownload, onDelete, deletingId }) => {
  const isDeleting = deletingId === pdf._id;
  // Delete is optional — omitting onDelete (e.g. from the Dashboard's
  // condensed document list) hides just the button. Delete itself is
  // untouched: the Documents page still passes onDelete and keeps working
  // exactly as before.
  const showDelete = typeof onDelete === "function";

  const metaBits = [
    typeFromName(pdf.originalName),
    formatBytes(pdf.fileSize),
    pdf.pageCount ? `${pdf.pageCount} page${pdf.pageCount > 1 ? "s" : ""}` : null,
    formatDate(pdf.uploadedAt),
  ].filter(Boolean);

  const Actions = ({ compact }) => (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => onView(pdf._id)}
        className={`inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-primary transition-colors ${compact ? "h-7 w-7" : "h-8 w-8"}`}
        title={`View ${pdf.originalName}`}
        aria-label="View"
      >
        <Eye className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      <button
        onClick={() => onDownload(pdf._id, pdf.originalName)}
        className={`inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-primary transition-colors ${compact ? "h-7 w-7" : "h-8 w-8"}`}
        title={`Download ${pdf.originalName}`}
        aria-label="Download"
      >
        <Download className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      {showDelete && (
        <button
          onClick={() => onDelete(pdf._id, pdf.originalName)}
          disabled={isDeleting}
          className={`inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50 ${compact ? "h-7 w-7" : "h-8 w-8"}`}
          title={`Delete ${pdf.originalName}`}
          aria-label="Delete"
        >
          {isDeleting ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: "linear" }}
              className="inline-flex"
            >
              <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </motion.span>
          ) : (
            <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="document-row-container rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 pl-3 pr-2 py-2.5 group">
      {/* Line 1 (always): icon + filename. Wide rows also inline meta+actions here. */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>

        <p
          className="min-w-[100px] flex-1 text-sm font-medium text-slate-900 dark:text-white truncate"
          title={pdf.originalName}
        >
          {pdf.originalName}
        </p>

        {/* Wide rows only: metadata inline on line 1 */}
        <div className="document-row-inline items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
          <span className="w-10 text-center font-medium text-slate-600 dark:text-slate-300">
            {typeFromName(pdf.originalName)}
          </span>
          <span className="w-14 text-right">{formatBytes(pdf.fileSize)}</span>
          <span className="w-14 text-right">
            {pdf.pageCount ? `${pdf.pageCount}p` : "—"}
          </span>
          <span className="w-16 text-right">{formatDate(pdf.uploadedAt)}</span>
        </div>

        {/* Wide rows only: actions inline on line 1 */}
        <div className="document-row-inline">
          <Actions compact={false} />
        </div>
      </div>

      {/* Narrow rows only: metadata + actions, indented under the filename */}
      <div className="document-row-stacked mt-1.5 pl-12 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
          {metaBits.join(" · ")}
        </p>
        <Actions compact={true} />
      </div>
    </div>
  );
};

export default DocumentRow;
