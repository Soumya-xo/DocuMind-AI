// Shared, real (non-fake) document view/download logic.
// Extracted verbatim from the Documents page so any part of the app can
// open/download a PDF the same, already-working way — no page should ever
// show a "View"/"Download" button that doesn't actually do anything.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// `pageNumber` is optional and only takes effect for PDFs (checked via the
// actual response content-type, not the filename, so it can't be spoofed by
// extension) — the browser's native PDF viewer honors a #page=N fragment on
// object/blob URLs the same way it does on a normal https:// PDF URL. Other
// formats, or a null/omitted page, just open the document as before.
export const viewPDFFile = async (id, { pageNumber } = {}) => {
  try {
    const res = await fetch(`${API_BASE}/api/pdf/view/${id}`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const msg = await res.text();
      alert(msg || "Failed to view document.");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const target =
      blob.type === "application/pdf" && pageNumber
        ? `${url}#page=${pageNumber}`
        : url;
    window.open(target, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (e) {
    alert(e?.message || "Failed to view document.");
  }
};

export const downloadPDFFile = async (id, originalName) => {
  try {
    const res = await fetch(`${API_BASE}/api/pdf/download/${id}`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const msg = await res.text();
      alert(msg || "Failed to download document.");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName || "document";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (e) {
    alert(e?.message || "Failed to download document.");
  }
};
