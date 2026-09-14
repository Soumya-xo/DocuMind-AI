# DocuMind AI
> An AI-powered document assistant that lets you upload documents, ask questions, and get grounded answers with source citations using Retrieval-Augmented Generation (RAG).
## 🚀 Live Demo
- **Frontend:** https://docu-mind-ai-seven-navy.vercel.app
- **Backend:** https://documind-ai-backend-aisl.onrender.com
---
## ✨ Features
### 📄 Document Intelligence
- Upload and process:
  - PDF
  - DOCX
  - TXT
  - Markdown
  - CSV
  - XLSX
- Automatic text extraction and chunking
- Page-aware PDF processing
- Document metadata stored in MongoDB
- Per-user document isolation
### 🤖 AI-Powered RAG
- Retrieval-Augmented Generation using FAISS
- Semantic similarity search
- Relevance filtering before generation
- Grounded responses based on document context
- Prevents unrelated documents from being used as context
- Supports chatting with:
  - All documents
  - Selected documents
  - A single document
### 📚 Source Citations
- Answers include document sources
- PDF citations include page information when available
- Sources are clickable from the chat interface
- Retrieved chunks retain document and page metadata
### ⚡ Streaming Responses
- AI responses stream progressively using SSE
- Chat UI updates while the model is generating
- Structured source information is returned with the final response
### 🧠 Multiple AI Providers
#### Local Development
Uses Ollama:
- `llama3.2` — text generation
- `nomic-embed-text` — embeddings
- `llava:7b` — image understanding
#### Production
Uses Google Gemini:
- Gemini Flash — text generation
- `gemini-embedding-001` — embeddings
The AI provider is configurable through environment variables.
### 🔄 AI Provider Fallback
When configured for Ollama, the application can fall back to Gemini if Ollama is unavailable before generation starts.
### 🖼️ Image Chat
- Attach images to conversations
- Paste images directly into the chat
- Drag and drop images
- Preview attached images
- Ask questions about images
- Supports image + text conversations
- Uses LLaVA for vision processing
### 🔐 Authentication
- JWT authentication
- Google OAuth
- Protected API routes
- User-specific documents and chats
- Ownership validation for document operations
### 🗂️ Document Index Management
- Provider-specific FAISS indexes
- Ollama and Gemini indexes remain isolated
- Manual document re-indexing
- Atomic vector-store rebuilds
- Existing valid indexes are preserved if a rebuild fails
### 💬 Chat Experience
- Persistent chat history
- Document-scoped conversations
- Copy responses
- Edit and regenerate messages
- Voice input support
- Image attachments
- Source citations
### 🎨 Responsive UI
- Responsive dashboard
- Mobile navigation drawer
- Document search
- Dark/light theme
- Responsive chat interface
- Clean document management UI
---
## 🏗️ Architecture
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
      │    Auth     │       │  Documents  │       │     Chat     │
      │ JWT / OAuth │       │  + RAG      │       │   + Vision   │
      └─────────────┘       └──────┬──────┘       └──────────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │  MongoDB    │
                            │ Metadata +  │
                            │ extracted   │
                            │ content     │
                            └──────┬──────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │    FAISS    │
                            │  Vector DB  │
                            └──────┬──────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │   AI Provider      │
                         │ Ollama / Gemini    │
                         └────────────────────┘

For detailed technical architecture, see ARCHITECTURE.md⁠￼.

⸻

🧩 Tech Stack

Layer	Technologies
Frontend	React, Vite, Tailwind CSS
Routing	React Router
HTTP	Axios
UI Animation	Framer Motion
Backend	Node.js, Express
Database	MongoDB, Mongoose
Authentication	JWT, Google OAuth
RAG	LangChain, FAISS
Local AI	Ollama
Cloud AI	Google Gemini
Embeddings	nomic-embed-text, gemini-embedding-001
Vision	LLaVA
Streaming	Server-Sent Events (SSE)
Frontend Deployment	Vercel
Backend Deployment	Render

⸻

🔄 RAG Pipeline

Document Upload
      │
      ▼
File Validation
      │
      ▼
Text Extraction
      │
      ▼
Page / Metadata Preservation
      │
      ▼
Text Chunking
      │
      ▼
Embedding Generation
      │
      ▼
FAISS Vector Store
      │
      ▼
User Question
      │
      ▼
Query Embedding
      │
      ▼
Similarity Search
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

⸻

📁 Project Structure

DocuMind-AI/
│
├── Backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── vectorstore/
│   ├── server.js
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── public/
│   └── package.json
│
├── ARCHITECTURE.md
├── TODO.md
├── README.md
└── .gitignore

⸻

⚙️ Local Setup

1. Clone the repository

git clone https://github.com/Soumya-xo/DocuMind-AI.git
cd DocuMind-AI

2. Install dependencies

cd Backend
npm install
cd ../Frontend
npm install

3. Configure environment variables

Create:

Backend/.env
Frontend/.env

Backend

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AI_EMBEDDING_PROVIDER=ollama
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

Frontend

VITE_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_google_client_id

Never commit .env files or API keys to GitHub.

⸻

🦙 Ollama Setup

Install and run Ollama locally, then pull the required models:

ollama pull llama3.2
ollama pull nomic-embed-text
ollama pull llava:7b

Make sure Ollama is running before starting the backend.

The local application uses:

Ollama
├── llama3.2
├── nomic-embed-text
└── llava:7b

⸻

▶️ Run Locally

Start Backend

cd Backend
npm start

Backend runs on:

http://localhost:5001

Start Frontend

In another terminal:

cd Frontend
npm run dev

Frontend runs on:

http://localhost:3000

⸻

🔎 Re-index Documents

If the embedding provider or vector index needs to be rebuilt, use the Re-index Documents option from:

Settings → Document Index → Re-index Documents

The backend rebuilds the active provider’s vector index from document data stored in MongoDB.

⸻

🔐 Security

DocuMind AI implements several security measures:

* JWT-protected API routes
* Google OAuth authentication
* User-level document isolation
* Document ownership validation
* Chat ownership validation
* Provider-specific vector-store isolation
* Environment-based secret management
* CORS origin restrictions
* No secrets exposed to the frontend

⸻

☁️ Deployment

Frontend

The React frontend is deployed on Vercel.

Vercel
   │
   ▼
React + Vite Frontend

Backend

The Node.js backend is deployed on Render.

Render
   │
   ▼
Node.js + Express API
   │
   ├── MongoDB
   └── Gemini API

Production AI

Production uses Gemini for:

Text Generation
       +
Embeddings

Local development uses Ollama instead.

⸻

⚠️ Production Storage Note

The current portfolio deployment uses Render’s free service.

Render’s free filesystem is ephemeral, so uploaded original files stored locally may disappear after a service restart or redeployment.

Extracted document content is also stored in MongoDB, allowing the RAG index to be rebuilt when necessary.

For a production-scale deployment, original files should be moved to persistent object storage such as S3-compatible storage or another managed storage provider.

⸻

📌 Current Status

DocuMind AI currently supports:

* ✅ Multi-format document upload
* ✅ PDF page-aware extraction
* ✅ Semantic RAG search
* ✅ FAISS vector storage
* ✅ Per-document chat
* ✅ Multi-document chat
* ✅ Source citations
* ✅ Clickable citations
* ✅ Streaming AI responses
* ✅ Ollama local AI
* ✅ Gemini production AI
* ✅ AI provider fallback
* ✅ Multiple embedding providers
* ✅ Image understanding
* ✅ LLaVA vision
* ✅ JWT authentication
* ✅ Google OAuth
* ✅ Persistent chat history
* ✅ Document re-indexing
* ✅ Atomic vector-store rebuilding
* ✅ Responsive UI
* ✅ Vercel + Render deployment

⸻

🛣️ Future Improvements

Potential future improvements include:

* Hybrid keyword + semantic search
* Cross-encoder / LLM reranking
* Automated RAG evaluation and benchmarks
* OCR for scanned documents
* Better table and image extraction
* Conversation memory
* Document tagging and filtering
* Persistent object storage
* Dockerized deployment
* Advanced analytics
* Improved scalability and caching
* Team workspaces and collaboration

⸻

📖 Documentation

* README.md⁠￼ — Project overview, features, setup and usage
* ARCHITECTURE.md⁠￼ — Detailed technical architecture
* TODO.md⁠￼ — Future improvements and roadmap

⸻

👨‍💻 Author

Soumya Ranjan Nayak

Built as a full-stack AI/RAG project to explore document intelligence, retrieval systems, AI provider abstraction, and production deployment.

⸻

📄 License

This project is intended primarily as a portfolio and learning project.