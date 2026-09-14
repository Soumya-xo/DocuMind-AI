# DocuMind AI — TODO

## 🚀 High Priority

### 🔎 Advanced RAG
- [ ] Implement hybrid search (semantic + keyword)
- [ ] Add reranking for retrieved chunks
- [ ] Improve retrieval quality for complex questions
- [ ] Add better handling for tables and structured documents

### 📊 RAG Evaluation
- [ ] Create a benchmark dataset
- [ ] Measure retrieval precision / recall
- [ ] Evaluate answer faithfulness
- [ ] Evaluate citation accuracy
- [ ] Compare different embedding models
- [ ] Compare different retrieval strategies

### 🧠 Conversation Memory
- [ ] Add conversation-level memory
- [ ] Support follow-up questions using previous context
- [ ] Improve long conversation handling
- [ ] Add conversation summarization for large histories

---

## 📄 Document Intelligence

### OCR & Scanned Documents
- [ ] Add OCR support for scanned PDFs
- [ ] Detect image-only PDFs automatically
- [ ] Extract text from images inside documents

### Tables & Images
- [ ] Improve table extraction
- [ ] Preserve table structure during chunking
- [ ] Support document image understanding
- [ ] Connect extracted images with RAG context

### Document Organization
- [ ] Add document tags
- [ ] Add folders / collections
- [ ] Add advanced document filtering
- [ ] Add sorting by date, size and type
- [ ] Add bulk document operations

---

## ☁️ Storage & Infrastructure

- [ ] Move uploaded files to persistent object storage
- [ ] Support S3-compatible storage
- [ ] Add file backup strategy
- [ ] Add automatic cleanup for unused files
- [ ] Add production-grade logging
- [ ] Add environment variable validation
- [ ] Add Docker support
- [ ] Add production deployment documentation

---

## ⚡ Performance & Scalability

- [ ] Add caching for repeated queries
- [ ] Optimize embedding generation
- [ ] Optimize large document ingestion
- [ ] Add background document processing
- [ ] Add job queues for heavy workloads
- [ ] Improve FAISS index management for large datasets
- [ ] Add rate limiting
- [ ] Add request monitoring

---

## 🔐 Authentication & Security

- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add session management
- [ ] Add refresh tokens
- [ ] Add account deletion
- [ ] Improve API rate limiting
- [ ] Add additional security logging

---

## 📈 Analytics & Monitoring

- [ ] Add usage analytics
- [ ] Track document processing time
- [ ] Track AI response latency
- [ ] Track token / API usage
- [ ] Track RAG retrieval quality
- [ ] Add error monitoring
- [ ] Add system health dashboard

---

## 🎨 UI / UX

- [ ] Improve loading states
- [ ] Improve error messages
- [ ] Add document processing progress
- [ ] Improve citation UI
- [ ] Add PDF page preview
- [ ] Add source highlighting
- [ ] Improve mobile experience
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility

---

## 🤝 Collaboration

- [ ] Add team workspaces
- [ ] Share documents with other users
- [ ] Add document permissions
- [ ] Add shared conversations
- [ ] Add workspace-level vector stores

---

## 🔌 API & Integrations

- [ ] Add public API
- [ ] Add API key authentication
- [ ] Add API documentation
- [ ] Add webhook support
- [ ] Add integrations with cloud storage providers

---

## 🧪 Testing & Reliability

- [ ] Expand backend unit tests
- [ ] Add integration tests
- [ ] Add RAG evaluation tests
- [ ] Add authentication security tests
- [ ] Add end-to-end frontend tests
- [ ] Test large document ingestion
- [ ] Test provider failure scenarios
- [ ] Test vector-store recovery
- [ ] Add CI/CD automated testing

---

## 📋 Completed

### Core Application
- [x] React + Vite frontend
- [x] Node.js + Express backend
- [x] MongoDB integration
- [x] JWT authentication
- [x] Google OAuth

### Document Processing
- [x] PDF support
- [x] DOCX support
- [x] TXT support
- [x] Markdown support
- [x] CSV support
- [x] XLSX support
- [x] Text extraction
- [x] Chunking
- [x] Page-aware PDF metadata

### RAG
- [x] FAISS vector search
- [x] Semantic retrieval
- [x] Relevance filtering
- [x] Per-user vector stores
- [x] Per-document retrieval
- [x] Multi-document retrieval
- [x] Source citations
- [x] Citation metadata
- [x] Document ownership validation

### AI
- [x] Ollama integration
- [x] Gemini integration
- [x] Gemini fallback
- [x] Multiple embedding providers
- [x] LLaVA image understanding
- [x] Image + text chat
- [x] Streaming AI responses

### Chat
- [x] Persistent chat history
- [x] Document-scoped conversations
- [x] Image attachments
- [x] Copy responses
- [x] Edit messages
- [x] Regenerate responses
- [x] Voice input
- [x] Clickable source citations

### Infrastructure
- [x] Atomic FAISS rebuild
- [x] Provider-specific vector indexes
- [x] Document re-indexing
- [x] Vercel deployment
- [x] Render deployment
- [x] Production CORS configuration
- [x] Environment-based AI configuration