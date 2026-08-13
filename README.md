# 🧠 DocuMind AI

**AI-Powered Document Intelligence Platform**

DocuMind AI is a full-stack **RAG (Retrieval-Augmented Generation)** application that combines conversational AI with advanced document intelligence. Upload documents, perform semantic searches, and chat with your knowledge base using local LLMs powered by **Ollama**.

[![Stack](https://img.shields.io/badge/Stack-MERN-green.svg)]()
[![AI](https://img.shields.io/badge/AI-Ollama-blue.svg)]()
[![Vector Search](https://img.shields.io/badge/Vector-FAISS-orange.svg)]()

---

## ✨ Features

### 🤖 AI Assistant
- Chat with uploaded documents
- Semantic document search
- Multi-document question answering
- Automatic document summarization
- Context-aware AI responses

### 📄 Supported File Types
- PDF
- DOCX
- TXT
- Markdown
- CSV
- XLSX

### 🔍 Advanced RAG Pipeline
- Text extraction
- Recursive text chunking
- Embedding generation with `nomic-embed-text`
- FAISS vector search
- Intelligent context retrieval
- Response generation with `llama3.2`

### 🔐 Authentication & Security
- JWT-based authentication
- Google OAuth login
- Secure user sessions
- User-specific document isolation

### 🎨 User Experience
- Modern responsive UI
- Dark / Light mode
- Document dashboard
- Chat history management

---

## 🏛️ System Architecture

```text
Upload Document
      ↓
Text Extraction
      ↓
Recursive Chunking
      ↓
Embeddings (nomic-embed-text)
      ↓
FAISS Vector Store
      ↓
Similarity Search
      ↓
Retrieved Context
      ↓
Ollama (llama3.2)
      ↓
AI Response
```

For a detailed technical breakdown, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React.js, Tailwind CSS, Axios, React Router |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **AI / RAG** | Ollama, LangChain, FAISS |
| **Embedding Model** | `nomic-embed-text` |
| **LLM** | `llama3.2` |
| **Database** | MongoDB Atlas |

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB Atlas account
- Ollama installed locally

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/Soumya-xo/DocuMind-AI.git
cd DocuMind-AI
```

---

## 2️⃣ Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5001

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Start the backend server:

```bash
npm run dev
```

Backend will run at **http://localhost:5001**

---

## 3️⃣ Frontend Setup

```bash
cd ../Frontend
npm install
```

Create a `.env` file inside `Frontend/`:

```env
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

Frontend will run at **http://localhost:3000**

---

## 4️⃣ Ollama Setup

Start Ollama:

```bash
ollama serve
```

In another terminal, pull the required models:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

Verify installation:

```bash
ollama list
```

Expected models:

- `llama3.2`
- `nomic-embed-text`

---

## 📂 Project Structure

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
│   └── vectorstore/
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── public/
├── ARCHITECTURE.md
├── TODO.md
└── README.md
```

---

## 🎯 Core Capabilities

| Feature | Description |
|---------|-------------|
| **Document Chat** | Ask questions about uploaded documents with AI-generated answers |
| **Semantic Search** | Retrieve information by meaning rather than keywords |
| **Multi-Document Q&A** | Query across all indexed documents |
| **Summarization** | Generate concise summaries of large documents |
| **Context Retrieval** | Ground responses using relevant document chunks |

---

## 🧪 Local Demo Checklist

- [x] User registration & login
- [x] Google OAuth login
- [x] PDF upload
- [x] Vector embedding generation
- [x] FAISS indexing
- [x] AI chat with uploaded documents
- [x] Multi-document retrieval
- [x] MongoDB persistence
- [x] Dark / Light theme

---

## 📸 Screenshots

Add screenshots after uploading images to your repository.

```md
![Dashboard](screenshots/dashboard.png)
![AI Chat](screenshots/chat.png)
```

---

## 🔒 Environment Variables

### Backend

```env
MONGODB_URI=
JWT_SECRET=
PORT=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Frontend

```env
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
```

---

## ⚠️ Important Notes

- Ollama must be running locally for AI features to work.
- Uploaded files and vector indexes are intentionally excluded from Git tracking.
- This project is designed for **local/private document intelligence** workflows.

---

## 🛣️ Future Roadmap

- [ ] Per-document chat filter
- [ ] Streaming AI responses
- [ ] OCR for scanned PDFs
- [ ] Docker support
- [ ] Cloud deployment
- [ ] Advanced analytics dashboard
- [ ] Multi-agent document analysis

See [TODO.md](./TODO.md) for the complete roadmap.

---

## 👨‍💻 Author

**Suvam Nayak**  
MCA (Generative AI) – SRM Institute of Science and Technology

- GitHub: [Soumya-xo](https://github.com/Soumya-xo)

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome. Feel free to open an issue or submit a pull request.

---

## 📜 License

This project is created for **educational and portfolio purposes**.

---

⭐ If you found this project useful, please consider giving it a **star** on GitHub!