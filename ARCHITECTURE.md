# 🏗️ DocuMind AI - System Architecture

## 📋 Project Overview

**DocuMind AI** is an AI-powered document intelligence platform that enables users to upload documents and interact with them through conversational AI. The application combines **Retrieval-Augmented Generation (RAG)**, **vector embeddings**, and **local LLM inference using Ollama** to provide semantic search, document analysis, summarization, and intelligent question answering.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React.js, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT, Google OAuth |
| **AI / ML** | Ollama, LangChain, FAISS, nomic-embed-text, llama3.2 |
| **File Processing** | pdf-parse, mammoth, csv-parser |
| **Deployment** | Vercel (Frontend), Node.js server (Backend) |

---

# 📁 Project Structure

```text
DocuMind-AI/
├── Backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── vectorstore/
│   └── server.js
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json
│
├── README.md
├── ARCHITECTURE.md
└── TODO.md
```

---

# 🏛️ High-Level Architecture

```text
┌──────────────────────────────────────────┐
│              Frontend (React)            │
│  - Authentication UI                     │
│  - Dashboard                             │
│  - Document Upload                       │
│  - AI Chat Interface                     │
│  - History & Settings                    │
└──────────────────────────────────────────┘
                    │
                    │ HTTP / Axios
                    ▼
┌──────────────────────────────────────────┐
│           Backend API (Express)          │
│  - Auth Routes                           │
│  - PDF Routes                            │
│  - Chat Routes                           │
│  - User Routes                           │
│  - JWT Middleware                        │
└──────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐     ┌──────────────────┐
│   MongoDB     │     │   File System    │
│ Users         │     │ uploads/         │
│ PDFs           │     │ vectorstore/     │
│ Chats          │     └──────────────────┘
└───────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│              RAG Service                 │
│  - Text Extraction                       │
│  - Chunking                              │
│  - Embedding Generation                  │
│  - FAISS Similarity Search               │
│  - Context Retrieval                     │
│  - Prompt Construction                   │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│            Ollama (Local AI)             │
│  - llama3.2                              │
│  - nomic-embed-text                      │
└──────────────────────────────────────────┘
```

---

# 🔐 Authentication Architecture

## Email / Password Flow

```text
User Login
   ↓
Express Auth Route
   ↓
bcrypt Password Verification
   ↓
JWT Token Generation
   ↓
Frontend stores token in localStorage
   ↓
Authenticated API Requests
```

## Google OAuth Flow

```text
Google Sign-In Button
   ↓
Google Identity Services
   ↓
Credential Token
   ↓
Backend /api/auth/google
   ↓
Verify Google Token
   ↓
Create / Fetch User
   ↓
Generate JWT
   ↓
Frontend Login Success
```

---

# 📄 Document Processing Pipeline

```text
Upload PDF / DOCX / CSV / TXT
        ↓
Multer stores file in uploads/
        ↓
Extract text
        ↓
Store metadata in MongoDB
        ↓
Chunk text (1000 chars, 200 overlap)
        ↓
Generate embeddings (nomic-embed-text)
        ↓
Store vectors in FAISS
```

---

# 🧠 RAG Query Pipeline

```text
User Question
      ↓
Convert question to embedding
      ↓
FAISS similarity search
      ↓
Retrieve top relevant chunks
      ↓
Build context prompt
      ↓
Send prompt to llama3.2 via Ollama
      ↓
Generate grounded response
      ↓
Return answer + source documents
```

---

# 📚 Vector Store Design

- **Engine:** FAISS
- **Storage:** `Backend/vectorstore/`
- **Isolation:** Separate index per user

Example:

```text
vectorstore/
 ├── user_64f1a2...
 ├── user_64f1b3...
 └── user_64f1c4...
```

---

# 🗄️ Database Schema

## User

```js
{
  name: String,
  email: String,
  password: String,
  avatar: String,
  isGoogleUser: Boolean,
  createdAt: Date
}
```

## PDF

```js
{
  userId: ObjectId,
  fileName: String,
  originalName: String,
  extractedText: String,
  fileSize: Number,
  uploadedAt: Date
}
```

## Chat

```js
{
  userId: ObjectId,
  question: String,
  answer: String,
  sourcePDFs: [String],
  createdAt: Date
}
```

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/google` |

## Documents

| Method | Endpoint |
|--------|----------|
| POST | `/api/pdf/upload` |
| GET | `/api/pdf/list` |
| DELETE | `/api/pdf/:id` |

## Chat

| Method | Endpoint |
|--------|----------|
| POST | `/api/chat/query` |
| GET | `/api/chat/history` |

## User

| Method | Endpoint |
|--------|----------|
| GET | `/api/user/profile` |
| PUT | `/api/user/profile` |

---

# 🎨 Frontend Architecture

### Pages
- Landing
- Login
- Register
- Dashboard
- Chat
- Documents
- History
- Settings

### Components
- Navbar
- ChatBox
- PDFUpload
- PDFList
- Avatar
- ThemeToggle

State is managed using React hooks and context.

---

# 🌙 Theme System

- Theme stored in localStorage
- React Context manages global theme state
- Tailwind `dark:` classes provide styling
- UI updates instantly without page reload

---

# 🚀 Runtime Environment

## Development

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:5001` |
| Ollama | `http://127.0.0.1:11434` |

## Production

| Service | URL |
|---------|-----|
| Frontend | Vercel |
| Backend | Node.js hosting |
| Database | MongoDB Atlas |

---

# 🔄 Example Workflows

## Upload Flow

```text
Frontend Upload Form
   ↓
POST /api/pdf/upload
   ↓
Save file
   ↓
Extract text
   ↓
Save metadata in MongoDB
   ↓
Generate embeddings
   ↓
Store in FAISS
   ↓
Return success response
```

## Chat Flow

```text
User asks question
   ↓
POST /api/chat/query
   ↓
Load user's FAISS index
   ↓
Retrieve relevant chunks
   ↓
Generate AI response
   ↓
Save chat history
   ↓
Return answer to frontend
```

---

# 🔧 Key Design Decisions

### Local AI Inference
- No external AI API dependency
- Better privacy
- No token cost

### FAISS Vector Store
- Fast semantic search
- Lightweight local storage
- Easy LangChain integration

### JWT Authentication
- Stateless sessions
- Easy frontend integration
- Scalable architecture

---

# 📈 Scalability Notes

- MongoDB indexes on `userId`
- Per-user vector indexes
- File storage can migrate to cloud storage
- Ollama can be containerized with Docker
- Backend APIs remain stateless

---

# 🧪 Implemented Features

- ✅ Email/password authentication
- ✅ Google OAuth login
- ✅ JWT authentication
- ✅ PDF/DOCX/TXT/CSV upload
- ✅ Semantic document search
- ✅ AI chat with documents
- ✅ Multi-document retrieval
- ✅ Chat history
- ✅ User profile & avatar
- ✅ Dark/light theme
- ✅ Local Ollama integration
- ✅ FAISS vector storage

---

# 🔮 Future Enhancements

- OCR for scanned documents
- Document-specific chat selection
- Streaming AI responses
- Team workspaces
- Role-based access control
- Cloud vector database support
- Multi-agent workflows

---

# 📝 Summary

DocuMind AI is a **full-stack RAG application** with a clear separation of concerns:

- **Frontend:** User interface and interactions
- **Backend:** APIs, authentication, and business logic
- **RAG Service:** Document indexing and semantic retrieval
- **FAISS:** Vector similarity search
- **Ollama:** Local LLM inference

The architecture provides a secure, private, and extensible platform for intelligent document analysis and conversational AI.
```