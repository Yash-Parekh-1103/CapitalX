# CapitalX

**An Equity Crowdfunding Platform with AI-Powered Investment Intelligence**

CapitalX is a modern crowdfunding platform where investors can fund startups in exchange for equity. The platform leverages AI/RAG (Retrieval-Augmented Generation) to provide intelligent insights, document analysis, and conversational assistance for making informed investment decisions.

## Vision

Bridge the gap between innovative startups and smart investors by providing:
- **Transparent equity crowdfunding** with clear ownership tracking
- **AI-powered insights** to analyze startup potential
- **Intelligent document processing** for pitch decks, business plans, and financials
- **Conversational AI assistant** to answer investor questions

## Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **Zod** - Schema validation

### Backend
- **Express.js** - REST API server
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe database queries
- **Zod** - Request/response validation

### AI/RAG Stack
- **Ollama** - Local LLM inference (llama3.1, mistral, etc.)
- **LangChain** - RAG framework and chains
- **Qdrant** - Vector database for embeddings
- **LangChain Document Loaders** - PDF, DOCX processing

## Core Features

### Platform Features
- User authentication (Investors & Founders)
- Startup profile management
- Campaign creation and fundraising
- Investment processing and equity allocation
- Document upload and management
- Transaction history and portfolio tracking

### AI Features (RAG-Powered)
1. **Document Q&A System** - Ask questions about uploaded documents
2. **Startup Analysis Engine** - Automated insights from pitch decks and business plans
3. **Investment Assistant Chatbot** - Conversational AI for investment guidance

## Project Structure

```
CapitalX/
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API clients
│   └── schemas/          # Zod validation schemas
├── backend/              # Express.js API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Drizzle schemas
│   │   ├── middleware/   # Auth, validation
│   │   └── services/     # Business logic
│   └── drizzle/          # Database migrations
├── ai-service/           # AI/RAG microservice
│   ├── src/
│   │   ├── chains/       # LangChain chains
│   │   ├── loaders/      # Document processors
│   │   ├── retrievers/   # Vector search logic
│   │   └── agents/       # AI agents
│   └── qdrant/           # Vector DB config
└── docs/                 # Documentation
    ├── IMPLEMENTATION_PLAN.md
    ├── AI_IMPLEMENTATION_GUIDE.md
    ├── DATABASE_SCHEMA.md
    └── API_DOCS.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Python 3.10+ (for Ollama)
- Docker (for Qdrant)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd CapitalX
```

2. **Set up PostgreSQL database**
```bash
# Create database
createdb capitalx

# Copy environment file
cp .env.example .env
# Update DATABASE_URL in .env
```

3. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# AI Service (if separate)
cd ../ai-service
npm install
```

4. **Run database migrations**
```bash
cd backend
npm run db:generate
npm run db:migrate
```

5. **Set up AI Stack** (Week 3)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3.1
ollama pull nomic-embed-text

# Run Qdrant with Docker
docker run -p 6333:6333 qdrant/qdrant
```

6. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - AI Service (Week 3)
cd ai-service
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Implementation Roadmap

### Week 1-2: Core Platform
Build the foundational crowdfunding platform with authentication, startup listings, and investment processing.

**See**: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed breakdown.

### Week 3: AI Features
Progressively implement RAG features from simple to complex.

**See**: [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md) for step-by-step guidance.

## Documentation

- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Week 1-2 frontend/backend development plan
- **[AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md)** - Week 3 AI/RAG implementation with learning path
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database tables and Zod schemas
- **[API_DOCS.md](./API_DOCS.md)** - API endpoints reference

## Learning Objectives

Through this project, you'll learn:
- Building full-stack applications with Next.js and Express
- Database design and ORM usage with Drizzle
- Document processing and chunking strategies
- Vector embeddings and similarity search
- Building RAG pipelines with LangChain
- Integrating AI features into production applications
- Prompt engineering for different use cases
- Conversation memory management

## Future Enhancements (Post Week 3)

Once you master LangChain basics:
- **LangGraph** - Build complex AI agent workflows
- **LangSmith** - Debug and monitor LangChain applications
- **Advanced RAG** - Hybrid search, re-ranking, query routing
- **Multi-agent systems** - Specialized agents for different tasks
- **Real-time AI** - Streaming responses
- **Fine-tuning** - Custom models for domain-specific tasks

## Contributing

This is a learning project. Feel free to experiment, break things, and learn!

## License

MIT

---

**Ready to build?** Start with [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for Week 1-2 development!
