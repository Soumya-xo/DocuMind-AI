import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import XLSX from "xlsx";

// Reconstructs a page's text in visual reading order (top-to-bottom,
// left-to-right) from pdf.js's raw getTextContent() items, instead of the
// content stream's paint order. For table/form-style PDFs (hall tickets, ID
// cards, certificates), the paint order frequently draws all label runs as
// one group and all value runs as a separate group, so naively joining
// item.str in that order scrambles which value belongs to which label even
// though both sit on the same visual row. Each item carries its own
// position (item.transform: [scaleX, skewX, skewY, scaleY, x, y]) and size
// (item.width/height), which is enough to rebuild actual rows/columns:
//
// 1. Sort items top-to-bottom by y (PDF's y-axis increases upward), then
//    left-to-right by x as a stable tie-breaker.
// 2. Cluster into visual lines: items whose y is within a small tolerance
//    of the current line's reference y belong to that line. Glyphs on one
//    rendered line share (almost) identical y; distinct lines are a full
//    line-height apart, comfortably larger than this tolerance for any
//    normal font size.
// 3. Within each line, re-sort left-to-right by x to restore column order.
// 4. Join items with a space only when the visual gap between them is wide
//    enough to be a real word boundary — avoids splitting single words that
//    pdf.js emitted as multiple adjacent glyph runs (common with kerning).
// 5. Join lines with "\n" so downstream chunking/LLM prompts see real row
//    boundaries instead of one run-on string.
//
// Normal single-column paragraph PDFs are unaffected: their items already
// fall one visual line after another in essentially the same order pdf.js
// emitted them, so this only adds line breaks where there were none.
const reconstructPageText = (items) => {
  const positioned = items
    .filter((item) => typeof item.str === "string" && item.str.length > 0)
    .map((item) => {
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;

      return {
        text: item.str,
        x,
        y,
        width: item.width || 0,
        height: item.height || Math.abs(item.transform?.[3]) || 1,
      };
    });

  if (positioned.length === 0) return "";

  positioned.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = [];
  let currentLine = null;

  for (const item of positioned) {
    const tolerance = Math.max(2, item.height * 0.4);

    if (currentLine && Math.abs(item.y - currentLine.y) <= tolerance) {
      currentLine.items.push(item);
    } else {
      currentLine = { y: item.y, items: [item] };
      lines.push(currentLine);
    }
  }

  const lineTexts = lines.map((line) => {
    line.items.sort((a, b) => a.x - b.x);

    let text = "";
    let prevRight = null;

    for (const item of line.items) {
      if (prevRight !== null) {
        const gap = item.x - prevRight;
        const spaceThreshold = Math.max(1, item.height * 0.25);

        if (gap > spaceThreshold && !/\s$/.test(text) && !/^\s/.test(item.text)) {
          text += " ";
        }
      }

      text += item.text;
      prevRight = item.x + item.width;
    }

    return text.trim();
  });

  return lineTexts.filter((line) => line.length > 0).join("\n");
};

export const extractTextFromFile = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();

  switch (ext) {
    case ".pdf": {
      const buffer = fs.readFileSync(file.path);

      // pdf-parse's `pagerender` callback fires once per page (in order,
      // via pdf.js) — this is the existing dependency's built-in way to
      // recover real page boundaries, so no new PDF library is needed.
      // pageNumber here is derived from actual page-render order, never
      // fabricated.
      const pageTexts = [];

      const pdfData = await pdfParse(buffer, {
        pagerender: async (pageData) => {
          const content = await pageData.getTextContent();
          const pageText = reconstructPageText(content.items);

          pageTexts.push({
            pageNumber: pageTexts.length + 1,
            text: pageText,
          });

          // pdf-parse still concatenates whatever we return into the
          // legacy flat `.text` field, so existing consumers of `.text`
          // keep working unchanged.
          return pageText;
        },
      });

      return {
        text: pdfData.text,
        pages: pdfData.numpages,
        pageTexts,
      };
    }

    case ".docx": {
      const result = await mammoth.extractRawText({
        path: file.path,
      });

      // DOCX has no reliable page-boundary concept in the extracted text,
      // so pageNumber stays null rather than being invented as "1".
      return {
        text: result.value,
        pages: 1,
        pageTexts: [{ pageNumber: null, text: result.value }],
      };
    }

    case ".txt":
    case ".md":
    case ".csv": {
      const text = fs.readFileSync(file.path, "utf8");

      return {
        text,
        pages: 1,
        pageTexts: [{ pageNumber: null, text }],
      };
    }

    case ".xlsx": {
      const workbook = XLSX.readFile(file.path);

      let text = "";

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];

        text += XLSX.utils.sheet_to_csv(worksheet) + "\n";
      });

      // Sheets aren't PDF pages, so pageNumber stays null (pages/sheet
      // count is still reported separately, unchanged from before).
      return {
        text,
        pages: workbook.SheetNames.length,
        pageTexts: [{ pageNumber: null, text }],
      };
    }

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
};
