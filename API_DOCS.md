# API Documentation

Complete API reference for CapitalX platform.

---

## Base URLs

```
Backend API:     http://localhost:3001/api
AI Service:      http://localhost:3002/api/ai
Frontend:        http://localhost:3000
```

---

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

### Getting a Token

Login or register to receive a JWT token. Include it in all subsequent requests.

---

## API Endpoints

## 1. Authentication

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "investor" // or "founder"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "investor"
  },
  "token": "jwt-token"
}
```

**Errors:**
- `400` - Validation error (email invalid, password too short)
- `409` - Email already exists

---

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "investor"
  },
  "token": "jwt-token"
}
```

**Errors:**
- `401` - Invalid credentials

---

### Get Current User

```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "investor",
  "bio": "Experienced investor...",
  "profileImage": "https://...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### Logout

```http
POST /api/auth/logout
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## 2. Startups

### Create Startup

```http
POST /api/startups
```

**Auth:** Required (Founder only)

**Request Body:**
```json
{
  "name": "TechStartup Inc",
  "tagline": "Revolutionizing the industry",
  "description": "We are building the future...",
  "logo": "https://...",
  "industry": "Technology",
  "stage": "mvp",
  "foundedYear": 2024,
  "website": "https://techstartup.com",
  "location": "San Francisco, CA",
  "teamSize": 5,
  "socialLinks": {
    "linkedin": "https://linkedin.com/company/...",
    "twitter": "https://twitter.com/..."
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "founderId": "uuid",
  "name": "TechStartup Inc",
  "tagline": "Revolutionizing the industry",
  ...
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `400` - Validation error
- `401` - Not authenticated
- `403` - Not a founder

---

### List Startups

```http
GET /api/startups
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `industry` (string, optional)
- `stage` (string, optional)
- `search` (string, optional)

**Response:** `200 OK`
```json
{
  "startups": [
    {
      "id": "uuid",
      "name": "TechStartup Inc",
      "tagline": "Revolutionizing the industry",
      "logo": "https://...",
      "industry": "Technology",
      "stage": "mvp",
      "founder": {
        "id": "uuid",
        "name": "Jane Founder"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### Get Startup by ID

```http
GET /api/startups/:id
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "TechStartup Inc",
  "tagline": "Revolutionizing the industry",
  "description": "We are building...",
  "logo": "https://...",
  "industry": "Technology",
  "stage": "mvp",
  "foundedYear": 2024,
  "founder": {
    "id": "uuid",
    "name": "Jane Founder",
    "email": "jane@startup.com"
  },
  "campaigns": [
    {
      "id": "uuid",
      "title": "Seed Round",
      "status": "active",
      "fundingGoal": "500000",
      "currentAmount": "125000"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `404` - Startup not found

---

### Update Startup

```http
PUT /api/startups/:id
```

**Auth:** Required (Owner only)

**Request Body:** (Partial update supported)
```json
{
  "description": "Updated description...",
  "teamSize": 10
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "TechStartup Inc",
  "description": "Updated description...",
  "teamSize": 10,
  ...
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not the owner
- `404` - Startup not found

---

### Delete Startup

```http
DELETE /api/startups/:id
```

**Auth:** Required (Owner only)

**Response:** `200 OK`
```json
{
  "message": "Startup deleted successfully"
}
```

---

### Get My Startups

```http
GET /api/startups/my
```

**Auth:** Required (Founder)

**Response:** `200 OK`
```json
{
  "startups": [
    {
      "id": "uuid",
      "name": "TechStartup Inc",
      ...
    }
  ]
}
```

---

## 3. Campaigns

### Create Campaign

```http
POST /api/campaigns
```

**Auth:** Required (Founder, owner of startup)

**Request Body:**
```json
{
  "startupId": "uuid",
  "title": "Seed Funding Round",
  "description": "Raising $500k for product development...",
  "fundingGoal": 500000,
  "minInvestment": 1000,
  "maxInvestment": 50000,
  "equityOffered": 10,
  "endDate": "2024-12-31T23:59:59Z",
  "status": "draft"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "startupId": "uuid",
  "title": "Seed Funding Round",
  "fundingGoal": "500000",
  "currentAmount": "0",
  "equityOffered": "10.00",
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### List Campaigns

```http
GET /api/campaigns
```

**Query Parameters:**
- `status` (string: active, draft, funded, closed)
- `page` (number)
- `limit` (number)

**Response:** `200 OK`
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "title": "Seed Funding Round",
      "fundingGoal": "500000",
      "currentAmount": "125000",
      "progress": 25,
      "status": "active",
      "startup": {
        "id": "uuid",
        "name": "TechStartup Inc",
        "logo": "https://..."
      }
    }
  ],
  "pagination": { ... }
}
```

---

### Get Campaign by ID

```http
GET /api/campaigns/:id
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Seed Funding Round",
  "description": "Raising $500k...",
  "fundingGoal": "500000",
  "currentAmount": "125000",
  "minInvestment": "1000",
  "maxInvestment": "50000",
  "equityOffered": "10.00",
  "status": "active",
  "investorCount": 15,
  "progress": 25,
  "daysRemaining": 45,
  "startup": {
    "id": "uuid",
    "name": "TechStartup Inc",
    "description": "...",
    "logo": "https://..."
  },
  "recentInvestments": [
    {
      "amount": "5000",
      "investorName": "Anonymous",
      "investedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Update Campaign

```http
PUT /api/campaigns/:id
```

**Auth:** Required (Owner)

**Request Body:** (Partial)
```json
{
  "description": "Updated description...",
  "endDate": "2024-12-31T23:59:59Z"
}
```

**Response:** `200 OK`

---

### Publish Campaign

```http
PATCH /api/campaigns/:id/publish
```

**Auth:** Required (Owner)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "active",
  "startDate": "2024-01-01T00:00:00Z"
}
```

---

### Close Campaign

```http
PATCH /api/campaigns/:id/close
```

**Auth:** Required (Owner)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "closed"
}
```

---

## 4. Investments

### Make Investment

```http
POST /api/investments
```

**Auth:** Required (Investor)

**Request Body:**
```json
{
  "campaignId": "uuid",
  "amount": 5000,
  "paymentMethod": "credit_card"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "investorId": "uuid",
  "campaignId": "uuid",
  "startupId": "uuid",
  "amount": "5000",
  "equityPercentage": "0.1000",
  "status": "completed",
  "investedAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `400` - Validation error (amount too low/high, campaign closed)
- `401` - Not authenticated
- `403` - Insufficient funds

---

### Get My Investments

```http
GET /api/investments/my
```

**Auth:** Required

**Response:** `200 OK`
```json
{
  "investments": [
    {
      "id": "uuid",
      "amount": "5000",
      "equityPercentage": "0.1000",
      "status": "completed",
      "investedAt": "2024-01-01T00:00:00Z",
      "campaign": {
        "id": "uuid",
        "title": "Seed Round"
      },
      "startup": {
        "id": "uuid",
        "name": "TechStartup Inc",
        "logo": "https://..."
      }
    }
  ],
  "totalInvested": "25000",
  "totalEquity": "2.5000"
}
```

---

### Get Investment Details

```http
GET /api/investments/:id
```

**Auth:** Required (Owner only)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "amount": "5000",
  "equityPercentage": "0.1000",
  "status": "completed",
  "paymentMethod": "credit_card",
  "transactionId": "txn_123",
  "investedAt": "2024-01-01T00:00:00Z",
  "campaign": { ... },
  "startup": { ... }
}
```

---

### Get Campaign Investments

```http
GET /api/campaigns/:id/investments
```

**Auth:** Required (Campaign owner)

**Response:** `200 OK`
```json
{
  "investments": [
    {
      "id": "uuid",
      "amount": "5000",
      "investorName": "John Investor",
      "investorEmail": "john@example.com",
      "investedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "totalAmount": "125000",
  "totalInvestors": 15
}
```

---

## 5. Portfolio

### Get Portfolio Summary

```http
GET /api/portfolio
```

**Auth:** Required (Investor)

**Response:** `200 OK`
```json
{
  "summary": {
    "totalInvested": "25000",
    "totalEquity": "2.5000",
    "portfolioValue": "28000",
    "unrealizedGain": "3000",
    "numberOfInvestments": 5,
    "numberOfStartups": 4
  },
  "holdings": [
    {
      "startupId": "uuid",
      "startupName": "TechStartup Inc",
      "logo": "https://...",
      "equityPercentage": "0.5000",
      "totalInvested": "5000",
      "currentValue": "5500",
      "unrealizedGain": "500",
      "acquisitionDate": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get Equity Holdings

```http
GET /api/portfolio/equity
```

**Auth:** Required

**Response:** `200 OK`
```json
{
  "holdings": [
    {
      "id": "uuid",
      "startupId": "uuid",
      "startupName": "TechStartup Inc",
      "equityPercentage": "0.5000",
      "shares": 500,
      "totalInvested": "5000",
      "currentValue": "5500"
    }
  ]
}
```

---

### Get Investment Statistics

```http
GET /api/portfolio/stats
```

**Auth:** Required

**Response:** `200 OK`
```json
{
  "totalInvested": "25000",
  "averageInvestment": "5000",
  "largestInvestment": "10000",
  "byIndustry": {
    "Technology": "15000",
    "Healthcare": "10000"
  },
  "byStage": {
    "mvp": "10000",
    "early_revenue": "15000"
  },
  "monthlyInvestments": [
    {
      "month": "2024-01",
      "amount": "5000",
      "count": 1
    }
  ]
}
```

---

## 6. AI Features

### Upload Document for Q&A

```http
POST /api/ai/qa/upload
```

**Auth:** Required  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (file) - PDF, DOCX, or TXT file
- `startupId` (string)
- `documentType` (string) - pitch, business_plan, financial, etc.

**Response:** `200 OK`
```json
{
  "documentId": "uuid",
  "chunksCount": 25,
  "message": "Document processed successfully"
}
```

---

### Ask Question About Document

```http
POST /api/ai/qa/ask
```

**Auth:** Required

**Request Body:**
```json
{
  "question": "What is the company's revenue model?",
  "documentId": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "answer": "The company operates on a SaaS subscription model with three tiers: Basic ($10/month), Pro ($50/month), and Enterprise (custom pricing). They also generate revenue from professional services and consulting.",
  "sources": [
    {
      "content": "Our revenue model is based on...",
      "metadata": {
        "documentId": "uuid",
        "page": 5,
        "chunkId": "uuid"
      }
    }
  ]
}
```

---

### Upload Startup Documents for Analysis

```http
POST /api/ai/analysis/startup/:startupId/documents
```

**Auth:** Required  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `files[]` (multiple files)
- `types[]` (array of strings) - document types for each file

**Response:** `200 OK`
```json
{
  "message": "All documents ingested",
  "count": 3,
  "documentIds": ["uuid1", "uuid2", "uuid3"]
}
```

---

### Analyze Startup

```http
POST /api/ai/analysis/startup/:startupId/analyze
```

**Auth:** Required

**Response:** `200 OK`
```json
{
  "startupId": "uuid",
  "analyzedAt": "2024-01-01T00:00:00Z",
  "analysis": {
    "market": "Market Analysis: The company operates in a $50B TAM...",
    "businessModel": "Business Model Analysis: Strong unit economics with...",
    "financial": "Financial Analysis: Current MRR of $50k with 20% MoM growth...",
    "risk": "Risk Assessment: Key risks include competition from...",
    "recommendation": "Overall Rating: 8/10. Investment Recommendation: Buy. This startup shows strong potential..."
  }
}
```

---

### Start Conversation

```http
POST /api/ai/chat/conversations
```

**Auth:** Required

**Response:** `201 Created`
```json
{
  "conversationId": "uuid"
}
```

---

### Send Chat Message

```http
POST /api/ai/chat/conversations/:conversationId/messages
```

**Auth:** Required

**Request Body:**
```json
{
  "message": "What startups are best for long-term investment?",
  "startupId": "uuid" // optional: filter to specific startup
}
```

**Response:** `200 OK`
```json
{
  "conversationId": "uuid",
  "message": "What startups are best for long-term investment?",
  "response": "Based on the analysis of available startups, I recommend focusing on companies with...",
  "sources": [
    {
      "content": "...",
      "metadata": { ... }
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

### Get Conversation History

```http
GET /api/ai/chat/conversations/:conversationId/messages
```

**Auth:** Required

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "What startups are best?",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Based on analysis...",
      "sources": [ ... ],
      "timestamp": "2024-01-01T12:00:05Z"
    }
  ]
}
```

---

### Clear Conversation

```http
DELETE /api/ai/chat/conversations/:conversationId
```

**Auth:** Required

**Response:** `200 OK`
```json
{
  "message": "Conversation cleared"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

API is rate-limited to:
- **Authentication endpoints**: 5 requests per minute
- **Standard endpoints**: 100 requests per minute
- **AI endpoints**: 10 requests per minute

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 60 seconds.",
  "retryAfter": 60
}
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Filtering & Sorting

Many list endpoints support filtering:

```
GET /api/startups?industry=Technology&stage=mvp&sort=createdAt:desc
```

**Common filters:**
- `industry` - Filter by industry
- `stage` - Filter by startup stage
- `status` - Filter by status
- `search` - Full-text search

**Sorting:**
- `sort=field:direction`
- Direction: `asc` or `desc`
- Example: `sort=createdAt:desc`

---

## Webhooks (Future Enhancement)

For real-time updates, you can register webhooks:

```http
POST /api/webhooks
```

**Events:**
- `investment.created`
- `campaign.funded`
- `analysis.completed`

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "investor"
  }'
```

### Make Investment
```bash
curl -X POST http://localhost:3001/api/investments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "campaignId": "uuid",
    "amount": 5000
  }'
```

### Ask AI Question
```bash
curl -X POST http://localhost:3002/api/ai/qa/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question": "What is the revenue model?",
    "documentId": "uuid"
  }'
```

---

## API Clients

### JavaScript/TypeScript

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export async function apiRequest(
  endpoint: string,
  options?: RequestInit
) {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'API request failed')
  }
  
  return response.json()
}

// Usage
const startups = await apiRequest('/startups')
const campaign = await apiRequest('/campaigns', {
  method: 'POST',
  body: JSON.stringify({ ... })
})
```

---

This API documentation covers all core endpoints. Refer to [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) and [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md) for implementation details.
