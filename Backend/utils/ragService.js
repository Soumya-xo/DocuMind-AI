import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import PDF from "../models/PDF.js";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VECTORSTORE_DIR = path.join(__dirname, "../vectorstore");

if (!fs.existsSync(VECTORSTORE_DIR)) {
  fs.mkdirSync(VECTORSTORE_DIR, { recursive: true });
}

const getEmbeddings = () => {
  return new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://127.0.0.1:11434",
  });
};

const getLLM = () => {
  return new ChatOllama({
    model: "llama3.2",
    baseUrl: "http://127.0.0.1:11434",
    temperature: 0.2,
  });
};

const getUserVectorStorePath = (userId) => {
  return path.join(VECTORSTORE_DIR, `user_${userId}`);
};

/**

* Add PDF text to vector store
  */
export const addPDFToVectorStore = async (userId, pdfText, pdfId, fileName) => {
  try {
    console.log(`🔧 addPDFToVectorStore: userId=${userId}, file=${fileName}`);

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error("PDF text is empty");
    }

    const embeddings = getEmbeddings();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments(
      [pdfText],
      [
        {
          pdfId: pdfId.toString(),
          fileName,
          userId: userId.toString(),
        },
      ],
    );

    console.log(`Created ${docs.length} chunks`);

    const storePath = getUserVectorStorePath(userId);

    let vectorStore;

    if (fs.existsSync(storePath)) {
      console.log("Loading existing vector store");

      vectorStore = await FaissStore.load(storePath, embeddings);

      await vectorStore.addDocuments(docs);
    } else {
      console.log("Creating new vector store");

      vectorStore = await FaissStore.fromDocuments(docs, embeddings);
    }

    await vectorStore.save(storePath);

    console.log(`Saved vector store to ${storePath}`);

    return {
      success: true,
      chunks: docs.length,
    };
  } catch (error) {
    console.error("❌ addPDFToVectorStore error:", error.message);
    throw error;
  }
};

/**

* Query vector store
  */
export const queryVectorStore = async (userId, question) => {
  try {
    console.log(`🔍 queryVectorStore: userId=${userId}`);

    const storePath = getUserVectorStorePath(userId);
    const llm = getLLM();

    const isAnalysisQuery =
      question.toLowerCase().includes("compare") ||
      question.toLowerCase().includes("difference") ||
      question.toLowerCase().includes("diff") ||
      question.toLowerCase().includes("similar") ||
      question.toLowerCase().includes("common") ||
      question.toLowerCase().includes("analyze") ||
      question.toLowerCase().includes("summary");

    // NO DOCUMENTS UPLOADED
    if (!fs.existsSync(storePath)) {
      console.log("No vector store found. Using AI only.");

      const response = await llm.invoke(`

You are a professional AI assistant.

Formatting Rules:

* Use markdown.
* Use headings when useful.
* Use bullet points.
* Use numbered lists.
* Use code blocks for code.
* Be clear and professional.

Question:
${question}
`);

      const answer = typeof response === "string" ? response : response.content;

      return {
        answer: answer.trim(),
        sourcePDFs: [],
      };
    }

    const embeddings = getEmbeddings();

    const vectorStore = await FaissStore.load(storePath, embeddings);

    const topK = isAnalysisQuery ? 20 : 8;

    const relevantDocs = await vectorStore.similaritySearch(question, topK);

    console.log(`Found ${relevantDocs.length} relevant chunks`);

    const context = relevantDocs
      .map(
        (doc, index) => `

Document: ${doc.metadata.fileName}

Chunk ${index + 1}:
${doc.pageContent}
`,
      )
      .join("\n\n----------------\n\n");

    const sourcePDFs = [
      ...new Set(relevantDocs.map((doc) => doc.metadata.fileName)),
    ];

    const prompt = `

You are a professional AI assistant with access to uploaded documents.

Rules:

1. If the answer exists in the document context, answer from the documents.

2. If the answer does NOT exist in the documents, answer using your own knowledge.

3. If the user asks to compare documents, analyze ALL provided documents.

4. If the user asks for similarities, differences, summaries, strengths, weaknesses, or common points, perform a detailed analysis.

5. Always use markdown formatting:

   * # Headings
   * ## Subheadings
   * Bullet points
   * Numbered lists
   * Tables when useful
   * Code blocks for code

6. Mention document names when comparing files.

DOCUMENT CONTEXT:

${context}

QUESTION:

${question}
`;

    const response = await llm.invoke(prompt);

    const answer = typeof response === "string" ? response : response.content;

    console.log("✅ Answer generated successfully");

    return {
      answer: answer.trim(),
      sourcePDFs,
    };
  } catch (error) {
    console.error("❌ queryVectorStore error:", error.message);
    throw error;
  }
};

/**

* Remove PDF from vector store
  */
export const removePDFFromVectorStore = async (
  userId,
  deletedPdfId
) => {
  try {
    const storePath = getUserVectorStorePath(userId);

    // No vector store exists
    if (!fs.existsSync(storePath)) {
      console.log("No vector store found.");
      return;
    }

    // Get all PDFs except the one being deleted
    const remainingPDFs = await PDF.find({
      userId,
      _id: { $ne: deletedPdfId },
    });

    // If no PDFs remain, remove FAISS completely
    if (remainingPDFs.length === 0) {
      fs.rmSync(storePath, {
        recursive: true,
        force: true,
      });

      console.log(
        "No PDFs left. Vector store removed completely."
      );

      return;
    }

    const embeddings = getEmbeddings();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    let allDocs = [];

    // Recreate chunks from remaining documents
    for (const pdf of remainingPDFs) {
      try {
        // Skip old records that don't contain extracted text
        if (!pdf.extractedText?.trim()) {
          console.warn(
            `Skipping ${pdf.originalName} (no extracted text found)`
          );
          continue;
        }

        const docs = await splitter.createDocuments(
          [pdf.extractedText],
          [
            {
              pdfId: pdf._id.toString(),
              fileName: pdf.originalName,
              userId: userId.toString(),
            },
          ]
        );

        allDocs.push(...docs);
      } catch (err) {
        console.error(
          `Failed to process ${pdf.originalName}:`,
          err.message
        );
      }
    }

    // No valid documents remain
    if (allDocs.length === 0) {
      fs.rmSync(storePath, {
        recursive: true,
        force: true,
      });

      console.log(
        "No valid document chunks remain. Vector store removed."
      );

      return;
    }

    // Delete old FAISS index
    if (fs.existsSync(storePath)) {
      fs.rmSync(storePath, {
        recursive: true,
        force: true,
      });
    }

    console.log(
      `Rebuilding FAISS with ${allDocs.length} chunks...`
    );

    // Create fresh FAISS index
    const newStore = await FaissStore.fromDocuments(
      allDocs,
      embeddings
    );

    await newStore.save(storePath);

    console.log(
      `FAISS rebuilt successfully. Total chunks: ${allDocs.length}`
    );
  } catch (error) {
    console.error(
      "removePDFFromVectorStore error:",
      error.message
    );
  }
};