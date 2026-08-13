import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import XLSX from "xlsx";

export const extractTextFromFile = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();

  switch (ext) {
    case ".pdf": {
      const buffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(buffer);
      return {
        text: pdfData.text,
        pages: pdfData.numpages,
      };
    }

    case ".docx": {
      const result = await mammoth.extractRawText({
        path: file.path,
      });

      return {
        text: result.value,
        pages: 1,
      };
    }

    case ".txt":
    case ".md":
    case ".csv": {
      const text = fs.readFileSync(file.path, "utf8");

      return {
        text,
        pages: 1,
      };
    }

    case ".xlsx": {
      const workbook = XLSX.readFile(file.path);

      let text = "";

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];

        text += XLSX.utils.sheet_to_csv(worksheet) + "\n";
      });

      return {
        text,
        pages: workbook.SheetNames.length,
      };
    }

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
};
