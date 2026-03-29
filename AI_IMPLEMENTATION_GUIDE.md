# Week 3: AI Implementation Guide

**Complete Step-by-Step Guide to Adding RAG Features to CapitalX**

This guide will take you from basic RAG concepts to implementing three production-ready AI features. Designed for developers with beginner-intermediate LangChain experience.

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [RAG Fundamentals](#rag-fundamentals)
3. [Day 1-2: Document Q&A System](#day-1-2-document-qa-system)
4. [Day 3-4: Startup Analysis Engine](#day-3-4-startup-analysis-engine)
5. [Day 5-7: Investment Assistant Chatbot](#day-5-7-investment-assistant-chatbot)
6. [Testing & Debugging](#testing--debugging)
7. [Future Enhancements](#future-enhancements)

---

## Prerequisites & Setup

### Understanding Check
Before starting Week 3, ensure you understand:
- ✅ What embeddings are (vector representations of text)
- ✅ Basic concept of vector similarity search
- ✅ How RAG works: Retrieve relevant context → Generate answer
- ✅ Express.js API development
- ✅ Async/await in JavaScript/TypeScript

### Tech Stack Setup

#### 1. Install Ollama (Local LLM)
```bash
# Linux/Mac
curl -fsSL https://ollama.ai/install.sh | sh

# Verify installation
ollama --version

# Pull required models
ollama pull llama3.1        # Main LLM for generation (4GB)
ollama pull nomic-embed-text  # Embedding model (274MB)

# Test the models
ollama run llama3.1 "Hello, explain what you are in one sentence"
```

**Why Ollama?**
- Run LLMs locally (no API costs)
- Fast inference
- Easy model management
- Great for learning and experimentation

#### 2. Set Up Qdrant (Vector Database)
```bash
# Option 1: Docker (Recommended)
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Option 2: Docker Compose
# Create docker-compose.yml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage

# Run: docker-compose up -d

# Verify Qdrant is running
curl http://localhost:6333
```

**Why Qdrant?**
- Fast vector search
- Great documentation
- Easy to set up
- Production-ready

#### 3. Install AI Dependencies
```bash
# Create ai-service directory
mkdir ai-service && cd ai-service
npm init -y

# Install LangChain and related packages
npm install langchain @langchain/ollama @langchain/qdrant

# Install document loaders
npm install pdf-parse mammoth   # PDF and DOCX parsing

# Install utilities
npm install dotenv express multer
npm install -D typescript @types/node @types/express tsx

# Initialize TypeScript
npx tsc --init
```

#### 4. Environment Variables
```bash
# ai-service/.env
OLLAMA_BASE_URL=http://localhost:11434
QDRANT_URL=http://localhost:6333
PORT=3002

# If Qdrant requires auth (production)
QDRANT_API_KEY=your_api_key
```

---

## RAG Fundamentals

Before diving into code, let's understand the RAG pipeline:

### The RAG Pipeline (5 Steps)

```
1. LOAD       → Read documents (PDF, DOCX, etc.)
2. SPLIT      → Break into chunks (512-1000 tokens)
3. EMBED      → Convert to vectors (embeddings)
4. STORE      → Save to vector database (Qdrant)
5. RETRIEVE   → Find relevant chunks
6. GENERATE   → Create answer with LLM
```

### Visual Flow
```
User Question
    ↓
Convert question to embedding
    ↓
Search Qdrant for similar vectors
    ↓
Get top K relevant chunks
    ↓
Combine chunks + question → LLM
    ↓
Generate answer
```

### Key Concepts

**Embeddings**: Converting text to numbers (vectors)
```
"Apple is a fruit" → [0.23, 0.87, -0.12, ..., 0.45]  (768 dimensions)
"Banana is yellow" → [0.19, 0.91, -0.08, ..., 0.52]
```

**Vector Similarity**: Finding similar meanings
```
Question: "What fruits are red?"
Similar to: "Apple is a fruit" (high similarity)
Not similar to: "Database schema" (low similarity)
```

**Chunking**: Breaking documents into pieces
```
Document (5000 words)
    ↓
Chunk 1 (500 words) → Embedding 1
Chunk 2 (500 words) → Embedding 2
Chunk 3 (500 words) → Embedding 3
...
```

---

## Day 1-2: Document Q&A System

**Goal**: Upload a document (PDF/DOCX) and ask questions about it.  
**Why first?**: Simplest RAG implementation, teaches core concepts.  
**Use case**: Investors ask questions about startup pitch decks.

### Architecture Overview

```
[Frontend] → Upload PDF
    ↓
[Backend API] → Save file
    ↓
[AI Service] → Process document
    ↓
1. Load PDF content
2. Split into chunks
3. Generate embeddings
4. Store in Qdrant
    ↓
[Frontend] → Ask question
    ↓
[AI Service] → Query RAG
    ↓
1. Embed question
2. Search Qdrant
3. Retrieve relevant chunks
4. Generate answer with LLM
    ↓
[Frontend] → Display answer
```

### Step 1: Project Structure

```
ai-service/
├── src/
│   ├── index.ts              # Express server
│   ├── config/
│   │   ├── ollama.ts         # Ollama client
│   │   └── qdrant.ts         # Qdrant client
│   ├── loaders/
│   │   └── documentLoader.ts # PDF/DOCX loading
│   ├── services/
│   │   ├── ingestion.ts      # Document processing
│   │   └── query.ts          # Question answering
│   ├── routes/
│   │   └── qa.ts             # API routes
│   └── utils/
│       └── chunking.ts       # Text splitting
├── uploads/                   # Temporary file storage
└── package.json
```

### Step 2: Configure Ollama & Qdrant

```typescript
// src/config/ollama.ts
import { Ollama } from '@langchain/ollama'

export const llm = new Ollama({
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: 'llama3.1',
  temperature: 0.7,  // Creativity level (0-1)
})

export const embeddings = new Ollama({
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: 'nomic-embed-text',
})
```

```typescript
// src/config/qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest'

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
})

// Collection name for document chunks
export const COLLECTION_NAME = 'capitalx_documents'
```

### Step 3: Document Loader

```typescript
// src/loaders/documentLoader.ts
import fs from 'fs/promises'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export async function loadDocument(filePath: string): Promise<string> {
  const ext = filePath.split('.').pop()?.toLowerCase()
  
  if (ext === 'pdf') {
    const dataBuffer = await fs.readFile(filePath)
    const data = await pdf(dataBuffer)
    return data.text
  }
  
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  }
  
  if (ext === 'txt') {
    return await fs.readFile(filePath, 'utf-8')
  }
  
  throw new Error(`Unsupported file type: ${ext}`)
}
```

### Step 4: Text Chunking

```typescript
// src/utils/chunking.ts
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

export async function chunkText(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,        // Max characters per chunk
    chunkOverlap: 200,      // Overlap between chunks (context preservation)
    separators: ['\n\n', '\n', '. ', ' ', ''],  // Split priority
  })
  
  const chunks = await splitter.createDocuments([text])
  return chunks
}

// Why chunking?
// - LLMs have token limits
// - Smaller chunks = more precise retrieval
// - Overlap preserves context across boundaries
```

### Step 5: Document Ingestion Pipeline

```typescript
// src/services/ingestion.ts
import { QdrantVectorStore } from '@langchain/qdrant'
import { embeddings, qdrantClient, COLLECTION_NAME } from '../config'
import { loadDocument } from '../loaders/documentLoader'
import { chunkText } from '../utils/chunking'
import { v4 as uuidv4 } from 'uuid'

export async function ingestDocument(
  filePath: string,
  metadata: { documentId: string; startupId: string; userId: string }
) {
  console.log('📄 Loading document...')
  const text = await loadDocument(filePath)
  
  console.log('✂️  Chunking text...')
  const chunks = await chunkText(text)
  
  console.log(`📦 Created ${chunks.length} chunks`)
  
  console.log('🔢 Generating embeddings...')
  // This is where the magic happens!
  const vectorStore = await QdrantVectorStore.fromDocuments(
    chunks.map(chunk => ({
      pageContent: chunk.pageContent,
      metadata: {
        ...metadata,
        chunkId: uuidv4(),
        timestamp: new Date().toISOString(),
      }
    })),
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: COLLECTION_NAME,
    }
  )
  
  console.log('✅ Document ingested successfully!')
  
  return {
    documentId: metadata.documentId,
    chunksCount: chunks.length,
  }
}

// What's happening?
// 1. Load document text
// 2. Split into chunks
// 3. For each chunk:
//    - Generate embedding vector (768 numbers)
//    - Store in Qdrant with metadata
// 4. Ready for querying!
```

### Step 6: Question Answering Service

```typescript
// src/services/query.ts
import { QdrantVectorStore } from '@langchain/qdrant'
import { RetrievalQAChain } from 'langchain/chains'
import { llm, embeddings, COLLECTION_NAME } from '../config'

export async function askQuestion(
  question: string,
  documentId: string
) {
  console.log(`❓ Question: ${question}`)
  
  // Step 1: Set up vector store
  const vectorStore = new QdrantVectorStore(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: COLLECTION_NAME,
    filter: {
      // Only search within this document
      must: [{ key: 'documentId', match: { value: documentId } }]
    }
  })
  
  // Step 2: Create retriever (finds relevant chunks)
  const retriever = vectorStore.asRetriever({
    k: 4,  // Return top 4 most relevant chunks
    searchType: 'similarity',
  })
  
  // Step 3: Create QA chain
  const chain = RetrievalQAChain.fromLLM(llm, retriever, {
    returnSourceDocuments: true,  // Include source chunks
  })
  
  // Step 4: Get answer
  console.log('🔍 Searching for relevant context...')
  const response = await chain.invoke({ query: question })
  
  console.log('💡 Generated answer!')
  
  return {
    answer: response.text,
    sources: response.sourceDocuments.map((doc: any) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }))
  }
}

// The RAG Magic:
// 1. Convert question to embedding
// 2. Search Qdrant for similar embeddings (relevant chunks)
// 3. Combine question + retrieved chunks
// 4. Send to LLM: "Based on this context, answer the question"
// 5. LLM generates answer using only provided context
```

### Step 7: API Routes

```typescript
// src/routes/qa.ts
import express from 'express'
import multer from 'multer'
import { ingestDocument } from '../services/ingestion'
import { askQuestion } from '../services/query'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Configure file upload
const upload = multer({ dest: 'uploads/' })

// Upload and process document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const documentId = uuidv4()
    
    const result = await ingestDocument(req.file.path, {
      documentId,
      startupId: req.body.startupId,
      userId: req.user.id,  // From auth middleware
    })
    
    res.json({
      message: 'Document processed successfully',
      ...result
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to process document' })
  }
})

// Ask question about document
router.post('/ask', async (req, res) => {
  try {
    const { question, documentId } = req.body
    
    if (!question || !documentId) {
      return res.status(400).json({ error: 'Missing question or documentId' })
    }
    
    const result = await askQuestion(question, documentId)
    
    res.json(result)
  } catch (error) {
    console.error('Query error:', error)
    res.status(500).json({ error: 'Failed to answer question' })
  }
})

export default router
```

### Step 8: Main Server

```typescript
// src/index.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import qaRoutes from './routes/qa'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/ai/qa', qaRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' })
})

const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`)
})
```

### Step 9: Frontend Integration

```typescript
// frontend/lib/ai-api.ts
export async function uploadDocument(file: File, startupId: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('startupId', startupId)
  
  const response = await fetch('http://localhost:3002/api/ai/qa/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  })
  
  return response.json()
}

export async function askDocumentQuestion(question: string, documentId: string) {
  const response = await fetch('http://localhost:3002/api/ai/qa/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ question, documentId })
  })
  
  return response.json()
}
```

```tsx
// frontend/components/DocumentQA.tsx
'use client'
import { useState } from 'react'
import { uploadDocument, askDocumentQuestion } from '@/lib/ai-api'

export function DocumentQA({ startupId }: { startupId: string }) {
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    try {
      const result = await uploadDocument(file, startupId)
      setDocumentId(result.documentId)
      alert('Document uploaded and processed!')
    } catch (error) {
      console.error(error)
      alert('Failed to upload document')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentId || !question) return
    
    setLoading(true)
    try {
      const result = await askDocumentQuestion(question, documentId)
      setAnswer(result)
    } catch (error) {
      console.error(error)
      alert('Failed to get answer')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2">Upload Document</label>
        <input type="file" onChange={handleUpload} accept=".pdf,.docx,.txt" />
      </div>
      
      {documentId && (
        <form onSubmit={handleAsk} className="space-y-4">
          <div>
            <label className="block mb-2">Ask a Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is the company's revenue?"
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </form>
      )}
      
      {answer && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-bold mb-2">Answer:</h3>
          <p>{answer.answer}</p>
          
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">
              View Sources
            </summary>
            <div className="mt-2 space-y-2">
              {answer.sources.map((source: any, i: number) => (
                <div key={i} className="text-xs bg-white p-2 rounded">
                  {source.content.substring(0, 200)}...
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
```

### Testing Your Document Q&A System

```bash
# Terminal 1: Start AI service
cd ai-service
npm run dev

# Terminal 2: Test with curl
curl -X POST http://localhost:3002/api/ai/qa/upload \
  -F "file=@pitch_deck.pdf" \
  -F "startupId=test-123"

# You should get back: { documentId: "uuid", chunksCount: 15 }

# Test querying
curl -X POST http://localhost:3002/api/ai/qa/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the business model?",
    "documentId": "uuid-from-upload"
  }'
```

### Day 1-2 Learning Outcomes

By completing this, you've learned:
- ✅ How to load and process documents (PDF, DOCX)
- ✅ Text chunking strategies and why they matter
- ✅ Generating embeddings with Ollama
- ✅ Storing vectors in Qdrant
- ✅ Vector similarity search
- ✅ Building a RetrievalQA chain in LangChain
- ✅ Integrating RAG with REST APIs
- ✅ Building a frontend for AI features

### Common Issues & Solutions

**Issue**: Ollama connection failed
```bash
# Solution: Check if Ollama is running
ollama list
# Restart if needed
systemctl restart ollama  # Linux
```

**Issue**: Embeddings are slow
```bash
# Solution: Ollama uses CPU by default. For GPU:
# Install CUDA/ROCm, then Ollama auto-detects GPU
ollama run llama3.1  # Check if using GPU in logs
```

**Issue**: Answers are not relevant
```typescript
// Solution: Adjust retriever parameters
const retriever = vectorStore.asRetriever({
  k: 6,  // Try more chunks
  searchType: 'mmr',  // Maximum Marginal Relevance (diversity)
})

// Or improve chunking
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,  // Smaller chunks for precision
  chunkOverlap: 100,
})
```

**Issue**: LLM hallucinates (makes up information)
```typescript
// Solution: Improve the prompt
const chain = RetrievalQAChain.fromLLM(llm, retriever, {
  prompt: `Answer the question based ONLY on the provided context.
If the answer is not in the context, say "I don't know".

Context: {context}

Question: {question}

Answer:`
})
```

---

## Day 3-4: Startup Analysis Engine

**Goal**: Automatically analyze startup documents and generate insights.  
**Why second?**: Builds on Day 1-2, adds structured output generation.  
**Use case**: AI analyzes pitch deck, business plan, financials and provides investment report.

### What's New?

Building on Document Q&A, you'll learn:
- Processing multiple documents for one startup
- Generating structured outputs (JSON)
- Using prompt templates for specific analysis tasks
- Creating custom LangChain chains

### Architecture

```
Multiple Documents (Pitch Deck, Business Plan, Financials)
    ↓
Ingest all to Qdrant (with startupId filter)
    ↓
Run Analysis Chain:
  1. Market Analysis
  2. Business Model Evaluation
  3. Financial Health
  4. Risk Assessment
  5. Investment Recommendation
    ↓
Return Structured Report (JSON)
```

### Step 1: Enhanced Document Metadata

```typescript
// When ingesting documents for analysis
export async function ingestStartupDocuments(
  files: { path: string; type: 'pitch' | 'business_plan' | 'financials' }[],
  startupId: string
) {
  for (const file of files) {
    await ingestDocument(file.path, {
      documentId: uuidv4(),
      startupId,
      documentType: file.type,  // New: Document type
      userId: 'system',
    })
  }
  
  return { message: 'All documents ingested', count: files.length }
}
```

### Step 2: Analysis Prompts

```typescript
// src/prompts/analysis.ts
import { PromptTemplate } from '@langchain/core/prompts'

export const marketAnalysisPrompt = PromptTemplate.fromTemplate(`
You are an expert startup analyst. Based on the provided context, analyze the market opportunity.

Context:
{context}

Analyze and provide:
1. Market Size: Estimate the TAM (Total Addressable Market)
2. Competition: Identify key competitors
3. Market Trends: Current trends affecting this market
4. Market Position: Where does this startup fit?

Provide your analysis in a clear, structured format.
`)

export const businessModelPrompt = PromptTemplate.fromTemplate(`
Analyze the business model from the provided context.

Context:
{context}

Evaluate:
1. Revenue Streams: How does the company make money?
2. Cost Structure: Major cost drivers
3. Unit Economics: Is the model scalable?
4. Moat: What competitive advantages exist?

Provide detailed analysis.
`)

export const financialAnalysisPrompt = PromptTemplate.fromTemplate(`
Analyze the financial health based on the context.

Context:
{context}

Evaluate:
1. Revenue: Current revenue and growth rate
2. Burn Rate: Monthly cash burn
3. Runway: Months of runway remaining
4. Unit Economics: CAC, LTV, margins
5. Projections: Are they realistic?

Provide your assessment.
`)

export const riskAssessmentPrompt = PromptTemplate.fromTemplate(`
Identify and assess risks for this startup.

Context:
{context}

Identify:
1. Market Risks
2. Execution Risks
3. Financial Risks
4. Competitive Risks
5. Regulatory Risks

For each risk, rate severity (Low/Medium/High) and provide mitigation strategies.
`)
```

### Step 3: Analysis Service

```typescript
// src/services/analysis.ts
import { QdrantVectorStore } from '@langchain/qdrant'
import { LLMChain } from 'langchain/chains'
import { llm, embeddings, COLLECTION_NAME } from '../config'
import {
  marketAnalysisPrompt,
  businessModelPrompt,
  financialAnalysisPrompt,
  riskAssessmentPrompt
} from '../prompts/analysis'

export async function analyzeStartup(startupId: string) {
  console.log(`🔬 Analyzing startup: ${startupId}`)
  
  // Set up vector store filtered to this startup
  const vectorStore = new QdrantVectorStore(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: COLLECTION_NAME,
    filter: {
      must: [{ key: 'startupId', match: { value: startupId } }]
    }
  })
  
  const retriever = vectorStore.asRetriever({ k: 10 })  // More context for analysis
  
  // Helper function to analyze with specific prompt
  async function analyzeWithPrompt(prompt: PromptTemplate, query: string) {
    const docs = await retriever.getRelevantDocuments(query)
    const context = docs.map(doc => doc.pageContent).join('\n\n')
    
    const chain = new LLMChain({ llm, prompt })
    const result = await chain.invoke({ context })
    
    return result.text
  }
  
  // Run all analyses
  console.log('📊 Running market analysis...')
  const marketAnalysis = await analyzeWithPrompt(
    marketAnalysisPrompt,
    'market size, competition, and market trends'
  )
  
  console.log('💼 Running business model analysis...')
  const businessModel = await analyzeWithPrompt(
    businessModelPrompt,
    'revenue model, costs, and business model'
  )
  
  console.log('💰 Running financial analysis...')
  const financialAnalysis = await analyzeWithPrompt(
    financialAnalysisPrompt,
    'revenue, burn rate, runway, and financials'
  )
  
  console.log('⚠️  Running risk assessment...')
  const riskAssessment = await analyzeWithPrompt(
    riskAssessmentPrompt,
    'risks, challenges, and threats'
  )
  
  // Generate overall recommendation
  console.log('🎯 Generating recommendation...')
  const recommendationPrompt = PromptTemplate.fromTemplate(`
Based on the following analyses, provide an investment recommendation.

Market Analysis:
{marketAnalysis}

Business Model:
{businessModel}

Financial Analysis:
{financialAnalysis}

Risk Assessment:
{riskAssessment}

Provide:
1. Overall Rating (1-10)
2. Investment Recommendation (Strong Buy/Buy/Hold/Avoid)
3. Key Strengths (3-5 points)
4. Key Concerns (3-5 points)
5. Suggested Investment Amount Range
  `)
  
  const recChain = new LLMChain({ llm, prompt: recommendationPrompt })
  const recommendation = await recChain.invoke({
    marketAnalysis,
    businessModel,
    financialAnalysis,
    riskAssessment
  })
  
  console.log('✅ Analysis complete!')
  
  return {
    startupId,
    analyzedAt: new Date().toISOString(),
    analysis: {
      market: marketAnalysis,
      businessModel,
      financial: financialAnalysis,
      risk: riskAssessment,
      recommendation: recommendation.text
    }
  }
}
```

### Step 4: Structured Output (Advanced)

For more structured results, use LangChain's structured output:

```typescript
// src/services/structuredAnalysis.ts
import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'

const analysisSchema = z.object({
  overallRating: z.number().min(1).max(10),
  recommendation: z.enum(['strong_buy', 'buy', 'hold', 'avoid']),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  suggestedInvestmentRange: z.object({
    min: z.number(),
    max: z.number()
  }),
  summary: z.string()
})

export async function analyzeStartupStructured(startupId: string) {
  const parser = StructuredOutputParser.fromZodSchema(analysisSchema)
  
  const prompt = PromptTemplate.fromTemplate(`
Analyze this startup and provide a structured investment report.

Context:
{context}

{format_instructions}

Provide your analysis:
  `)
  
  const formatInstructions = parser.getFormatInstructions()
  
  // ... retrieve context and generate ...
  
  const result = await chain.invoke({
    context,
    format_instructions: formatInstructions
  })
  
  const parsed = await parser.parse(result.text)
  
  return parsed  // Returns type-safe object
}
```

### Step 5: API Routes

```typescript
// src/routes/analysis.ts
import express from 'express'
import multer from 'multer'
import { ingestStartupDocuments } from '../services/ingestion'
import { analyzeStartup } from '../services/analysis'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

// Upload multiple documents for a startup
router.post('/startup/:startupId/documents', upload.array('files', 5), async (req, res) => {
  try {
    const { startupId } = req.params
    const files = (req.files as Express.Multer.File[]).map((file, i) => ({
      path: file.path,
      type: req.body.types[i] || 'pitch'  // Document types from form
    }))
    
    const result = await ingestStartupDocuments(files, startupId)
    
    res.json(result)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to process documents' })
  }
})

// Analyze startup
router.post('/startup/:startupId/analyze', async (req, res) => {
  try {
    const { startupId } = req.params
    
    const analysis = await analyzeStartup(startupId)
    
    // Optional: Save to database
    // await db.insert(analyses).values(analysis)
    
    res.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze startup' })
  }
})

export default router
```

### Step 6: Frontend Component

```tsx
// frontend/app/startups/[id]/analysis/page.tsx
'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function StartupAnalysisPage() {
  const { id: startupId } = useParams()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const runAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:3002/api/ai/analysis/startup/${startupId}/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        }
      )
      const result = await response.json()
      setAnalysis(result)
    } catch (error) {
      console.error(error)
      alert('Analysis failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">AI Startup Analysis</h1>
      
      <button
        onClick={runAnalysis}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {loading ? '🤖 Analyzing...' : 'Run AI Analysis'}
      </button>
      
      {analysis && (
        <div className="mt-8 space-y-6">
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">📊 Market Analysis</h2>
            <p className="whitespace-pre-wrap">{analysis.analysis.market}</p>
          </section>
          
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">💼 Business Model</h2>
            <p className="whitespace-pre-wrap">{analysis.analysis.businessModel}</p>
          </section>
          
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">💰 Financial Analysis</h2>
            <p className="whitespace-pre-wrap">{analysis.analysis.financial}</p>
          </section>
          
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">⚠️ Risk Assessment</h2>
            <p className="whitespace-pre-wrap">{analysis.analysis.risk}</p>
          </section>
          
          <section className="bg-green-50 p-6 rounded shadow border-2 border-green-200">
            <h2 className="text-xl font-bold mb-4">🎯 Investment Recommendation</h2>
            <p className="whitespace-pre-wrap">{analysis.analysis.recommendation}</p>
          </section>
        </div>
      )}
    </div>
  )
}
```

### Day 3-4 Learning Outcomes

You've learned:
- ✅ Processing multiple documents with filters
- ✅ Creating custom prompt templates
- ✅ Running multiple analysis tasks
- ✅ Generating structured outputs
- ✅ Building domain-specific AI applications
- ✅ Prompt engineering for analysis tasks

### Improvement Ideas

1. **Parallel Analysis**: Run all analyses in parallel
```typescript
const [market, business, financial, risk] = await Promise.all([
  analyzeWithPrompt(marketAnalysisPrompt, 'market'),
  analyzeWithPrompt(businessModelPrompt, 'business'),
  analyzeWithPrompt(financialAnalysisPrompt, 'financial'),
  analyzeWithPrompt(riskAssessmentPrompt, 'risk'),
])
```

2. **Caching**: Store analyses in database to avoid re-running
```typescript
// Check if recent analysis exists
const cached = await db.query.analyses.findFirst({
  where: and(
    eq(analyses.startupId, startupId),
    gt(analyses.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24h
  )
})

if (cached) return cached
```

3. **Comparative Analysis**: Compare multiple startups
```typescript
export async function compareStartups(startupIds: string[]) {
  const analyses = await Promise.all(
    startupIds.map(id => analyzeStartup(id))
  )
  
  // Generate comparison using LLM
  // ...
}
```

---

## Day 5-7: Investment Assistant Chatbot

**Goal**: Conversational AI that answers investor questions with context awareness.  
**Why last?**: Most complex - combines RAG with conversation memory.  
**Use case**: Investors chat with AI about startups, get personalized investment guidance.

### What's New?

- Conversation memory (chat history)
- Multi-turn interactions
- Context-aware responses
- Combining chat history + RAG retrieval

### Architecture

```
User Message
    ↓
Load Conversation History
    ↓
Combine:
  - Current message
  - Previous messages (memory)
  - Retrieved context (RAG)
    ↓
Generate Response
    ↓
Save to Memory
    ↓
Return to User
```

### Step 1: Memory Management

```typescript
// src/services/memory.ts
import { BufferMemory } from 'langchain/memory'
import { ChatMessageHistory } from 'langchain/stores/message/in_memory'

// In-memory storage (use database in production)
const conversationMemories = new Map<string, BufferMemory>()

export function getMemory(conversationId: string): BufferMemory {
  if (!conversationMemories.has(conversationId)) {
    conversationMemories.set(
      conversationId,
      new BufferMemory({
        returnMessages: true,
        memoryKey: 'chat_history',
        inputKey: 'question',
        outputKey: 'answer'
      })
    )
  }
  
  return conversationMemories.get(conversationId)!
}

export function clearMemory(conversationId: string) {
  conversationMemories.delete(conversationId)
}

// Why memory?
// Allows: "What's their revenue?" → "How does that compare to competitors?"
// The "that" refers to previous context
```

### Step 2: Conversational Retrieval Chain

```typescript
// src/services/chatbot.ts
import { ConversationalRetrievalQAChain } from 'langchain/chains'
import { QdrantVectorStore } from '@langchain/qdrant'
import { llm, embeddings, COLLECTION_NAME } from '../config'
import { getMemory } from './memory'

export async function chatWithAssistant(
  message: string,
  conversationId: string,
  filters?: { startupId?: string; documentId?: string }
) {
  console.log(`💬 Message: ${message}`)
  
  // Set up vector store with filters
  const vectorStore = new QdrantVectorStore(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: COLLECTION_NAME,
    filter: filters ? {
      must: Object.entries(filters)
        .filter(([_, v]) => v)
        .map(([k, v]) => ({ key: k, match: { value: v } }))
    } : undefined
  })
  
  // Get conversation memory
  const memory = getMemory(conversationId)
  
  // Create conversational chain
  const chain = ConversationalRetrievalQAChain.fromLLM(
    llm,
    vectorStore.asRetriever({ k: 5 }),
    {
      memory,
      returnSourceDocuments: true,
      questionGeneratorChainOptions: {
        llm,  // LLM for rephrasing questions
      },
    }
  )
  
  // Get response
  console.log('🤖 Generating response...')
  const response = await chain.invoke({
    question: message
  })
  
  console.log('✅ Response generated')
  
  return {
    answer: response.text,
    sources: response.sourceDocuments?.map((doc: any) => ({
      content: doc.pageContent.substring(0, 200),
      metadata: doc.metadata
    })) || []
  }
}

// How it works:
// 1. Takes user message
// 2. Loads previous chat history from memory
// 3. Uses LLM to rephrase question with context:
//    "How does that compare?" → "How does TechStartup's revenue compare to competitors?"
// 4. Retrieves relevant documents
// 5. Generates answer considering both history and retrieved docs
// 6. Saves interaction to memory
```

### Step 3: Enhanced Chatbot with System Prompt

```typescript
// src/services/enhancedChatbot.ts
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'

const systemPrompt = `You are an expert investment advisor specializing in startup investments. 

Your role:
- Help investors make informed investment decisions
- Analyze startup potential based on provided documents
- Answer questions about market, business model, financials, and risks
- Provide balanced, objective advice
- Cite sources from documents when possible

Guidelines:
- Be professional and clear
- If you don't know something, say so
- Don't make up financial figures
- Consider both opportunities and risks
- Tailor advice to user's investment profile (when provided)

Remember: You're an advisor, not a decision-maker. Provide insights, not commands.`

const chatPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
  ['system', 'Relevant context from documents:\n{context}']
])

export async function chatWithEnhancedAssistant(
  message: string,
  conversationId: string,
  userProfile?: { investorType: string; riskTolerance: string }
) {
  // Retrieve context
  const vectorStore = new QdrantVectorStore(/*...*/)
  const relevantDocs = await vectorStore.asRetriever({ k: 4 })
    .getRelevantDocuments(message)
  
  const context = relevantDocs.map(doc => doc.pageContent).join('\n\n')
  
  // Get chat history
  const memory = getMemory(conversationId)
  const history = await memory.loadMemoryVariables({})
  
  // Create chain
  const chain = RunnableSequence.from([
    chatPrompt,
    llm,
    new StringOutputParser()
  ])
  
  // Generate response
  const response = await chain.invoke({
    question: message,
    context,
    chat_history: history.chat_history || []
  })
  
  // Save to memory
  await memory.saveContext(
    { question: message },
    { answer: response }
  )
  
  return { answer: response, sources: relevantDocs }
}
```

### Step 4: Streaming Responses (Real-time)

For better UX, stream responses:

```typescript
// src/services/streamingChatbot.ts
export async function chatWithStreaming(
  message: string,
  conversationId: string,
  onToken: (token: string) => void
) {
  const chain = ConversationalRetrievalQAChain.fromLLM(/*...*/)
  
  const stream = await chain.stream({
    question: message
  })
  
  let fullResponse = ''
  
  for await (const chunk of stream) {
    if (chunk.text) {
      fullResponse += chunk.text
      onToken(chunk.text)  // Send token to client
    }
  }
  
  return { answer: fullResponse }
}
```

### Step 5: API Routes

```typescript
// src/routes/chat.ts
import express from 'express'
import { chatWithAssistant } from '../services/chatbot'
import { clearMemory } from '../services/memory'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Start new conversation
router.post('/conversations', (req, res) => {
  const conversationId = uuidv4()
  res.json({ conversationId })
})

// Send message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params
    const { message, startupId, documentId } = req.body
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' })
    }
    
    const result = await chatWithAssistant(message, conversationId, {
      startupId,
      documentId
    })
    
    res.json({
      conversationId,
      message,
      response: result.answer,
      sources: result.sources,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

// Clear conversation
router.delete('/conversations/:conversationId', (req, res) => {
  const { conversationId } = req.params
  clearMemory(conversationId)
  res.json({ message: 'Conversation cleared' })
})

// Get conversation history (if stored in DB)
router.get('/conversations/:conversationId/messages', async (req, res) => {
  // Retrieve from database
  // const messages = await db.query.chatMessages.findMany({ ... })
  // res.json({ messages })
})

export default router
```

### Step 6: Frontend Chat Interface

```tsx
// frontend/components/ChatAssistant.tsx
'use client'
import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: any[]
}

export function ChatAssistant({ startupId }: { startupId?: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Initialize conversation
  useEffect(() => {
    async function initConversation() {
      const res = await fetch('http://localhost:3002/api/ai/chat/conversations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setConversationId(data.conversationId)
    }
    
    initConversation()
  }, [])
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !conversationId) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      const res = await fetch(
        `http://localhost:3002/api/ai/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            message: input,
            startupId
          })
        }
      )
      
      const data = await res.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        sources: data.sources
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Send message error:', error)
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50">
        <h3 className="font-bold text-lg">🤖 Investment Assistant</h3>
        <p className="text-sm text-gray-600">
          Ask me anything about {startupId ? 'this startup' : 'investments'}
        </p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>👋 Hi! I'm your AI investment assistant.</p>
            <p className="text-sm mt-2">Ask me about market analysis, business models, or risks.</p>
          </div>
        )}
        
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              
              {msg.sources && msg.sources.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer opacity-70">
                    📚 {msg.sources.length} sources
                  </summary>
                  <div className="mt-1 space-y-1">
                    {msg.sources.map((source, i) => (
                      <div key={i} className="bg-white bg-opacity-50 p-1 rounded">
                        {source.content}...
                      </div>
                    ))}
                  </div>
                </details>
              )}
              
              <p className="text-xs opacity-60 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
```

### Step 7: Persistent Memory (Database)

For production, store chat history in database:

```typescript
// backend/src/models/schema.ts (Add to Drizzle schema)
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  startupId: uuid('startup_id').references(() => startups.id).nullable(),
  createdAt: timestamp('created_at').defaultNow()
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id),
  role: text('role').$type<'user' | 'assistant'>().notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // sources, tokens used, etc.
  createdAt: timestamp('created_at').defaultNow()
})

// Save to DB after each message
async function saveMessage(conversationId: string, role: string, content: string) {
  await db.insert(chatMessages).values({
    conversationId,
    role,
    content,
    createdAt: new Date()
  })
}

// Load history from DB
async function loadConversationHistory(conversationId: string) {
  const messages = await db.query.chatMessages.findMany({
    where: eq(chatMessages.conversationId, conversationId),
    orderBy: asc(chatMessages.createdAt)
  })
  
  return messages
}
```

### Day 5-7 Learning Outcomes

You've learned:
- ✅ Conversation memory management
- ✅ Multi-turn dialogue handling
- ✅ Combining chat history with RAG retrieval
- ✅ Building conversational chains
- ✅ Creating chat interfaces
- ✅ Streaming responses (optional)
- ✅ Persistent chat storage

### Advanced Enhancements

**1. Suggested Questions**
```typescript
async function generateSuggestedQuestions(startupId: string) {
  const prompt = `Based on this startup's documents, suggest 3 interesting questions 
  an investor might ask. Make them specific and insightful.`
  
  // Generate with LLM
  // Return: ["What is the CAC payback period?", ...]
}
```

**2. User Feedback Loop**
```tsx
// Add thumbs up/down to responses
<div className="flex space-x-2 mt-2">
  <button onClick={() => feedback('positive', msg.id)}>👍</button>
  <button onClick={() => feedback('negative', msg.id)}>👎</button>
</div>

// Use feedback to improve prompts/retrieval
```

**3. Context Pruning**
```typescript
// Limit memory to last N messages to avoid token limits
const memory = new BufferWindowMemory({
  k: 10,  // Keep last 10 exchanges
  memoryKey: 'chat_history',
  returnMessages: true
})
```

**4. Multi-Startup Comparison**
```typescript
// Allow asking: "Compare TechCo and StartupX's revenue models"
async function chatWithMultiStartupContext(
  message: string,
  startupIds: string[]
) {
  // Retrieve from multiple startup documents
  // Generate comparative analysis
}
```

---

## Testing & Debugging

### Testing Checklist

**Document Q&A**
- [ ] Upload PDF, DOCX, TXT files
- [ ] Verify chunks are created
- [ ] Check embeddings in Qdrant
- [ ] Ask questions and verify answers
- [ ] Test with irrelevant questions (should say "I don't know")

**Startup Analysis**
- [ ] Upload multiple documents for one startup
- [ ] Run analysis and check all sections
- [ ] Verify filtering by startupId works
- [ ] Test with incomplete data

**Chatbot**
- [ ] Send multiple messages in conversation
- [ ] Verify memory works (ask follow-up questions)
- [ ] Test filtering by startup/document
- [ ] Clear conversation and verify reset

### Debugging Tools

**1. Qdrant UI**
```bash
# Access Qdrant dashboard
open http://localhost:6333/dashboard

# View collections, vectors, and search
```

**2. LangSmith (Future)**
```typescript
// Set up LangSmith for tracing
import { LangSmithClient } from 'langsmith'

process.env.LANGCHAIN_TRACING_V2 = 'true'
process.env.LANGCHAIN_API_KEY = 'your-key'

// Automatically traces all LangChain calls
```

**3. Logging**
```typescript
// Add detailed logging
chain.invoke({
  callbacks: [{
    handleLLMStart: (...args) => console.log('LLM Start:', args),
    handleLLMEnd: (...args) => console.log('LLM End:', args),
    handleChainStart: (...args) => console.log('Chain Start:', args),
  }]
})
```

**4. Testing Embeddings**
```typescript
// Test similarity search manually
const query = "What is the revenue?"
const queryEmbedding = await embeddings.embedQuery(query)

const results = await qdrantClient.search(COLLECTION_NAME, {
  vector: queryEmbedding,
  limit: 5
})

console.log('Search results:', results)
```

### Common Issues

**Issue**: Slow response times
```typescript
// Solution 1: Reduce retrieval count
const retriever = vectorStore.asRetriever({ k: 3 })  // Instead of 10

// Solution 2: Use smaller model
ollama pull llama3.2  // Smaller, faster

// Solution 3: Implement caching
```

**Issue**: Out of context errors
```typescript
// Solution: Use larger context window model
// llama3.1:8b (8k context)
// llama3.1:70b (128k context)
ollama pull llama3.1:70b
```

**Issue**: Hallucinations
```typescript
// Solution: Stricter prompts
const prompt = `Answer ONLY based on provided context.
If the answer is not explicitly in the context, respond with:
"I don't have enough information to answer that."

Never make assumptions or use external knowledge.`
```

---

## Future Enhancements

### After Mastering LangChain Basics

**1. LangGraph - Complex Workflows**
```typescript
// Agent workflow: Research → Analyze → Generate Report
import { StateGraph } from '@langchain/langgraph'

const workflow = new StateGraph({
  nodes: {
    research: researchAgent,
    analyze: analysisAgent,
    report: reportGenerator
  },
  edges: [
    ['research', 'analyze'],
    ['analyze', 'report']
  ]
})
```

**2. LangSmith - Monitoring & Debugging**
```typescript
// Track performance, costs, and quality
// Debug chains visually
// A/B test different prompts
```

**3. Advanced RAG Techniques**
```typescript
// Hybrid search (keyword + semantic)
// Re-ranking retrieved documents
// Query routing (different retrievers for different question types)
// Hypothetical document embeddings (HyDE)
// Parent document retrieval
```

**4. Multi-Agent Systems**
```typescript
// Specialized agents:
// - Financial analyst agent
// - Market research agent
// - Risk assessment agent
// - Compliance agent
// Orchestrator coordinates between them
```

**5. Fine-Tuning**
```typescript
// Fine-tune models on your domain:
// - Investment-specific terminology
// - Industry knowledge
// - Your company's analysis style
```

---

## Week 3 Completion Checklist

By end of Week 3, you should have:
- ✅ Working Document Q&A system
- ✅ Startup Analysis Engine generating reports
- ✅ Conversational AI chatbot with memory
- ✅ Understanding of RAG pipeline
- ✅ Experience with Ollama and Qdrant
- ✅ Knowledge of LangChain chains and retrievers
- ✅ Prompt engineering skills
- ✅ Production-ready AI features integrated with your platform

---

## Next Steps

**Continue Learning:**
1. Experiment with different models (Mistral, Llama 3.2, Gemma)
2. Try different chunking strategies
3. Optimize retrieval (adjust k, use MMR)
4. Add streaming for better UX
5. Implement feedback loops
6. Monitor and improve with LangSmith

**Scale Your Project:**
- Add more AI features (document summarization, email generation)
- Implement LangGraph for complex workflows
- Build specialized agents
- Fine-tune models on your data
- Deploy to production

---

**Congratulations!** 🎉

You've built a production-grade equity crowdfunding platform with cutting-edge AI features. You now understand RAG fundamentals and are ready to explore advanced AI concepts with LangGraph and LangSmith.

Keep learning, keep building! 🚀
