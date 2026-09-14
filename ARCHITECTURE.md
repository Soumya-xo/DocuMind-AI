# DocuMind AI — Architecture
## 1. Architecture Overview
DocuMind AI is a full-stack AI document assistant built around a Retrieval-Augmented Generation (RAG) architecture.
The system supports document upload, text extraction, embeddings, vector search, AI-powered question answering, source citations, per-document chat, image understanding, and streaming responses.
```text
                         ┌──────────────────────┐
                         │       Frontend       │
                         │   React + Vite       │
                         │   Tailwind CSS        │
                         └──────────┬───────────┘
                                    │
                              HTTP / SSE
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Backend        │
                         │   Node.js + Express  │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
      │    Auth     │       │  Document   │       │     Chat     │
      │ JWT / OAuth │       │  Pipeline   │       │   /ask       │
      └─────────────┘       └──────┬──────┘       └──────┬───────┘
                                   │                      │
                                   ▼                      ▼
                            ┌─────────────┐       ┌──────────────┐
                            │  MongoDB    │       │ RAG Pipeline │
                            │ Metadata +  │       │ Retrieval +  │
                            │ extracted   │       │ Generation   │
                            │ content     │       └──────┬───────┘
                            └─────────────┘              │
                                                        ▼
                                             ┌────────────────────┐
                                             │   AI Provider      │
                                             │ Ollama → Gemini    │
                                             └────────────────────┘

⸻

2. Technology Stack

Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Framer Motion

Backend

* Node.js
* Express
* Mongoose
* JWT Authentication
* Google OAuth

AI / RAG

* LangChain
* FAISS
* Ollama
* Gemini API
* LLaVA for image understanding
* nomic-embed-text
* gemini-embedding-001

Database

* MongoDB

Deployment

* Vercel — Frontend
* Render — Backend
* MongoDB — Database

⸻

3. Backend Architecture

The backend follows a layered structure:

Backend/
├── controllers/
│   ├── authController.js
│   ├── chatController.js
│   └── pdfController.js
│
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   └── pdfRoutes.js
│
├── models/
│   ├── User.js
│   ├── PDF.js
│   └── Chat.js
│
├── services/
│   ├── aiProvider.js
│   └── embeddingProvider.js
│
├── utils/
│   ├── fileExtractor.js
│   └── ragService.js
│
└── server.js

Responsibility

* Routes — Define API endpoints.
* Controllers — Handle requests and responses.
* Models — Define MongoDB schemas.
* Services — Handle AI and embedding providers.
* Utilities — Handle extraction, chunking, retrieval and vector operations.
* Middleware — Handles authentication and request protection.

⸻

4. Document Ingestion Pipeline

When a user uploads a document:

Upload
  │
  ▼
Authentication
  │
  ▼
File Validation
  │
  ▼
Text Extraction
  │
  ├── PDF
  ├── DOCX
  ├── TXT
  ├── Markdown
  ├── CSV
  └── XLSX
  │
  ▼
Page / Content Metadata
  │
  ▼
Text Chunking
  │
  ▼
Embedding Generation
  │
  ├── Ollama
  │
  └── Gemini
  │
  ▼
FAISS Vector Store
  │
  ▼
MongoDB Document Metadata

For PDFs, page information is preserved during extraction so retrieved chunks can later be connected to the correct page.

Each chunk stores metadata such as:

documentId
fileName
pageNumber
chunkIndex

This metadata is used for filtering and source citations.

⸻

5. RAG Query Pipeline

When a user asks a question:

User Question
      │
      ▼
Authentication
      │
      ▼
Document Scope
      │
      ├── All Documents
      │
      └── Selected Documents
      │
      ▼
Query Embedding
      │
      ▼
FAISS Similarity Search
      │
      ▼
Relevance Filtering
      │
      ▼
Relevant Chunks
      │
      ▼
Context Construction
      │
      ▼
AI Generation
      │
      ▼
Answer + Sources
      │
      ▼
SSE Streaming Response

Retrieval

FAISS performs vector similarity search over document chunks.

The system additionally applies relevance filtering instead of blindly using a fixed number of chunks.

For document-specific chat, retrieved chunks are filtered using their documentId.

This prevents unrelated documents from being used as context.

⸻

6. AI Provider Architecture

DocuMind AI supports two AI environments.

                    AI Request
                        │
                        ▼
                 ┌──────────────┐
                 │ AI Provider   │
                 └──────┬───────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
          Ollama                Gemini
       Local Development       Production
              │                   │
              ▼                   ▼
         Local Models        Gemini Models

Local Development

Ollama is used for local AI processing.

LLM: llama3.2
Embeddings: nomic-embed-text
Vision: llava:7b

This allows the application to run AI workloads locally without requiring a cloud API.

Production

The deployed backend uses Gemini.

Generation:
Gemini Flash
Embeddings:
gemini-embedding-001

The provider configuration is environment-based, so the frontend does not need to know which AI provider is being used.

Fallback

For text generation, Ollama is attempted first when configured.

If Ollama is unavailable before generation starts, the system can fall back to Gemini.

Ollama
   │
   ├── Available ───────► Generate Response
   │
   └── Unavailable
            │
            ▼
         Gemini
            │
            ▼
      Generate Response

The fallback happens at the provider layer and does not change the RAG pipeline.

⸻

7. Vector Store Architecture

Vector stores are maintained separately for each user.

Backend/vectorstore/
user_<id>/
├── faiss.index
├── docstore.json
└── embedding-meta.json
user_<id>/gemini/
├── faiss.index
├── docstore.json
└── embedding-meta.json

This provides:

* User-level isolation
* Provider-level isolation
* Protection against embedding-dimension/provider mismatches
* Independent Ollama and Gemini indexes

The vector store can be rebuilt from document data stored in MongoDB.

Re-indexing uses an atomic rebuild process so an existing valid index is not replaced by a partially built index.

⸻

8. Authentication & Security

Authentication uses:

JWT
+
Google OAuth

Protected API requests require an authenticated user.

Document and chat operations are scoped to the authenticated user’s ID.

The backend verifies document ownership before allowing operations such as:

* Document retrieval
* Document-specific chat
* File access
* Chat history access
* Document deletion

Sensitive configuration such as:

MONGODB_URI
JWT_SECRET
GOOGLE_CLIENT_SECRET
GEMINI_API_KEY

is stored through environment variables and is not exposed to the frontend.

⸻

9. Image Understanding

DocuMind AI also supports image-based conversations.

Image
  │
  ▼
Frontend
  │
  ▼
Backend /ask-image
  │
  ▼
Vision Model
(LLaVA)
  │
  ▼
Image Understanding
  │
  ▼
Response

Images can be combined with user text.

Image-only requests are handled separately from the document RAG pipeline unless document context is explicitly requested.

⸻

10. Streaming Responses

Text responses are delivered using Server-Sent Events (SSE).

User
 │
 ▼
Backend
 │
 ▼
RAG Retrieval
 │
 ▼
AI Generation
 │
 ├── token ──► Frontend
 ├── token ──► Frontend
 ├── token ──► Frontend
 │
 └── sources ─► Frontend

This allows the UI to display the response progressively instead of waiting for the complete AI response.

Sources are sent as structured data and displayed as clickable citations.

⸻

11. Database Architecture

MongoDB stores persistent application data.

MongoDB
│
├── Users
│   ├── authentication data
│   └── account information
│
├── PDFs
│   ├── file metadata
│   ├── extracted text
│   ├── page information
│   └── ownership
│
└── Chats
    ├── messages
    ├── document scope
    ├── sources
    └── image metadata

MongoDB stores extracted document content so the vector index can be rebuilt when necessary.

⸻

12. Deployment Architecture

                 Internet
                    │
                    ▼
        ┌─────────────────────┐
        │       Vercel        │
        │   React Frontend    │
        └──────────┬──────────┘
                   │ HTTPS
                   ▼
        ┌─────────────────────┐
        │       Render        │
        │ Node + Express API  │
        └───────┬─────┬───────┘
                │     │
                │     └──────────────► Gemini API
                │
                ▼
        ┌─────────────────────┐
        │       MongoDB       │
        │ Persistent Database │
        └─────────────────────┘

Production

* Frontend → Vercel
* Backend → Render
* Database → MongoDB
* AI → Gemini
* Authentication → JWT + Google OAuth

Local Development

React/Vite
    │
    ▼
Node/Express
    │
    ├── MongoDB
    │
    └── Ollama
          ├── llama3.2
          ├── nomic-embed-text
          └── llava

⸻

13. Storage Consideration

The current portfolio deployment uses Render’s free service.

The application stores uploaded files on the backend filesystem, while extracted document content is also stored in MongoDB.

Because the free Render filesystem is ephemeral, uploaded files may disappear after service restarts or redeployments.

The application can still rebuild the RAG index from MongoDB-stored extracted content, but direct file viewing/downloading may require persistent object storage.

A future production architecture can use:

Frontend
   │
Backend
   │
   ├── MongoDB ─────── Metadata + extracted content
   │
   └── Object Storage ─ Original files

Possible future storage solutions include S3-compatible object storage or managed cloud storage.

⸻

14. Design Principles

The architecture is designed around:

* Modularity — AI providers and embeddings are isolated behind services.
* User isolation — Documents and vector stores are scoped per user.
* Provider flexibility — Local Ollama and cloud Gemini can be switched through configuration.
* Grounded generation — AI answers are based on retrieved document context.
* Source traceability — Retrieved chunks retain document and page metadata.
* Fault tolerance — Provider fallback and atomic vector-store rebuilds reduce failure impact.
* Scalability — AI, database, vector search and storage layers can be replaced or scaled independently.

⸻

15. Overall Data Flow

                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ React Frontend  │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Express Backend │
                       └───────┬─────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Authentication    Documents           Chat
             │                 │                 │
             │                 ▼                 ▼
             │             Extraction        Retrieval
             │                 │                 │
             │                 ▼                 ▼
             │              Chunks           FAISS Search
             │                 │                 │
             │                 ▼                 ▼
             │             Embeddings         Context
             │                 │                 │
             │                 ▼                 ▼
             │              FAISS           AI Provider
             │                                   │
             │                          ┌────────┴────────┐
             │                          │                 │
             │                       Ollama            Gemini
             │
             ▼
          MongoDB
             │
             ├── Users
             ├── Documents
             └── Chats

This architecture keeps the application layer, RAG layer, AI provider layer, authentication layer, and persistence layer separated, making DocuMind AI easier to maintain, test, and extend.