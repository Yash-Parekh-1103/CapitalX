# Week 1-2: Core Platform Implementation Plan

This document outlines the development plan for building the foundational CapitalX platform (frontend + backend) before adding AI features.

## Overview

**Timeline**: 2 weeks  
**Goal**: Working equity crowdfunding platform with user authentication, startup listings, and investment processing  
**Approach**: Build feature-by-feature (backend API → frontend UI)

---

## Week 1: Foundation & User Management

### Day 1-2: Project Setup & Database

#### Backend Setup
**Tasks:**
- [ ] Initialize Express.js project with TypeScript
- [ ] Configure PostgreSQL connection
- [ ] Set up Drizzle ORM
- [ ] Create initial database schema (see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md))
- [ ] Set up environment variables

**Key Files:**
```
backend/
├── src/
│   ├── index.ts           # Express server
│   ├── db/
│   │   └── index.ts       # Database connection
│   └── models/
│       └── schema.ts      # Drizzle schemas
├── drizzle.config.ts
├── .env
└── package.json
```

**Tech Setup:**
```bash
npm install express drizzle-orm postgres dotenv zod
npm install -D typescript @types/node @types/express tsx
npm install -D drizzle-kit
```

**Snippet - Database Connection:**
```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client)
```

#### Frontend Setup
**Tasks:**
- [ ] Initialize Next.js 14+ with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up folder structure (app router)
- [ ] Create layout and basic navigation
- [ ] Set up environment variables

**Key Files:**
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx          # Home page
│   └── globals.css
├── components/
│   └── ui/               # Reusable components
├── lib/
│   └── api.ts           # API client
└── package.json
```

---

### Day 3-4: Authentication System

#### Backend: Auth API
**Tasks:**
- [ ] Create users table migration
- [ ] Implement password hashing (bcrypt)
- [ ] Build JWT authentication
- [ ] Create auth middleware
- [ ] Build auth routes (register, login, logout)

**API Endpoints:**
```
POST /api/auth/register   # Create new account
POST /api/auth/login      # Login user
POST /api/auth/logout     # Logout user
GET  /api/auth/me         # Get current user
```

**Snippet - Auth Middleware:**
```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

**Zod Validation:**
```typescript
// Shared schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['investor', 'founder'])
})
```

#### Frontend: Auth UI
**Tasks:**
- [ ] Create login page
- [ ] Create registration page
- [ ] Build form components with validation
- [ ] Implement JWT storage (localStorage/cookies)
- [ ] Create protected route wrapper
- [ ] Add auth context provider

**Pages:**
```
app/
├── auth/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
```

**Snippet - Auth Context:**
```typescript
// lib/auth-context.tsx
'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Check auth status on mount
  // Provide login, logout, register functions
  
  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

### Day 5-7: Startup Management

#### Backend: Startup CRUD API
**Tasks:**
- [ ] Create startups table migration
- [ ] Build startup routes (CRUD operations)
- [ ] Add file upload for logos/images (multer)
- [ ] Implement validation with Zod
- [ ] Add authorization (only founders can create/edit)

**API Endpoints:**
```
POST   /api/startups          # Create startup (founders only)
GET    /api/startups          # List all startups (public)
GET    /api/startups/:id      # Get startup details
PUT    /api/startups/:id      # Update startup (owner only)
DELETE /api/startups/:id      # Delete startup (owner only)
GET    /api/startups/my       # Get current user's startups
```

**Snippet - Create Startup:**
```typescript
// src/controllers/startup.ts
export async function createStartup(req, res) {
  const validated = startupSchema.parse(req.body)
  
  const startup = await db.insert(startups).values({
    ...validated,
    founderId: req.user.id,
    createdAt: new Date()
  }).returning()
  
  res.json(startup)
}
```

#### Frontend: Startup Pages
**Tasks:**
- [ ] Create startup listing page (browse all)
- [ ] Build startup detail page
- [ ] Create startup form (create/edit)
- [ ] Add image upload component
- [ ] Build startup card component
- [ ] Add search and filters (optional)

**Pages:**
```
app/
├── startups/
│   ├── page.tsx              # List all startups
│   ├── [id]/
│   │   └── page.tsx          # Startup detail
│   └── create/
│       └── page.tsx          # Create new (founders)
└── dashboard/
    └── startups/
        └── page.tsx          # My startups
```

---

## Week 2: Campaigns & Investment Processing

### Day 8-10: Fundraising Campaigns

#### Backend: Campaign API
**Tasks:**
- [ ] Create campaigns table migration
- [ ] Build campaign CRUD routes
- [ ] Link campaigns to startups (one-to-many)
- [ ] Add campaign status (draft, active, closed, funded)
- [ ] Calculate funding progress
- [ ] Add validation for equity percentages

**API Endpoints:**
```
POST   /api/campaigns                 # Create campaign
GET    /api/campaigns                 # List campaigns (filter by status)
GET    /api/campaigns/:id             # Get campaign details
PUT    /api/campaigns/:id             # Update campaign
PATCH  /api/campaigns/:id/publish     # Publish campaign (set active)
PATCH  /api/campaigns/:id/close       # Close campaign
GET    /api/startups/:id/campaigns    # Get startup's campaigns
```

**Campaign Schema (Zod):**
```typescript
const campaignSchema = z.object({
  startupId: z.string().uuid(),
  title: z.string().min(5),
  description: z.string().min(50),
  fundingGoal: z.number().positive(),
  minInvestment: z.number().positive(),
  maxInvestment: z.number().positive(),
  equityOffered: z.number().min(1).max(100),
  deadline: z.string().datetime(),
  status: z.enum(['draft', 'active', 'closed', 'funded'])
})
```

#### Frontend: Campaign Pages
**Tasks:**
- [ ] Create campaign listing page
- [ ] Build campaign detail page
- [ ] Create campaign form
- [ ] Add progress bar component
- [ ] Display funding statistics
- [ ] Add campaign status badges

**Pages:**
```
app/
├── campaigns/
│   ├── page.tsx              # Browse campaigns
│   ├── [id]/
│   │   └── page.tsx          # Campaign detail
│   └── create/
│       └── page.tsx          # Create campaign
```

---

### Day 11-12: Investment Processing

#### Backend: Investment API
**Tasks:**
- [ ] Create investments table migration
- [ ] Create equity_holdings table migration
- [ ] Build investment creation endpoint
- [ ] Calculate equity allocation
- [ ] Update campaign funding amount
- [ ] Validate investment limits (min/max)
- [ ] Check campaign status (only active campaigns)

**API Endpoints:**
```
POST   /api/investments              # Make investment
GET    /api/investments              # Get all investments (admin)
GET    /api/investments/my           # Get user's investments
GET    /api/investments/:id          # Get investment details
GET    /api/campaigns/:id/investments  # Campaign's investments
```

**Snippet - Investment Logic:**
```typescript
// src/services/investment.ts
export async function createInvestment(data) {
  // 1. Validate campaign is active
  // 2. Check min/max investment limits
  // 3. Check if goal exceeded
  // 4. Calculate equity percentage
  // 5. Create investment record
  // 6. Create equity holding record
  // 7. Update campaign current amount
  
  const equityPercentage = (amount / campaign.fundingGoal) * campaign.equityOffered
  
  return await db.transaction(async (tx) => {
    // Insert investment
    // Insert equity holding
    // Update campaign
  })
}
```

#### Frontend: Investment Flow
**Tasks:**
- [ ] Create investment modal/page
- [ ] Build investment form with validation
- [ ] Add payment integration (placeholder for now)
- [ ] Display investment confirmation
- [ ] Show success/error messages

**Components:**
```
components/
├── investment/
│   ├── InvestmentForm.tsx
│   ├── InvestmentModal.tsx
│   └── InvestmentConfirmation.tsx
```

---

### Day 13-14: User Dashboard & Portfolio

#### Backend: Portfolio API
**Tasks:**
- [ ] Build portfolio endpoint (user's investments)
- [ ] Calculate portfolio value
- [ ] Get equity holdings
- [ ] Get investment history
- [ ] Generate investment statistics

**API Endpoints:**
```
GET /api/portfolio               # User's portfolio summary
GET /api/portfolio/investments   # Detailed investment list
GET /api/portfolio/equity        # Equity holdings
GET /api/portfolio/stats         # Investment statistics
```

#### Frontend: Dashboard
**Tasks:**
- [ ] Create investor dashboard
- [ ] Create founder dashboard
- [ ] Build portfolio view (investments, equity)
- [ ] Display statistics and charts
- [ ] Show transaction history
- [ ] Add profile management page

**Pages:**
```
app/
└── dashboard/
    ├── page.tsx              # Main dashboard (role-based)
    ├── portfolio/
    │   └── page.tsx          # Investor portfolio
    ├── startups/
    │   └── page.tsx          # Founder's startups
    └── profile/
        └── page.tsx          # User profile
```

---

## Testing & Polish (Remaining Time)

### Tasks:
- [ ] Test all API endpoints with Postman/Thunder Client
- [ ] Test frontend flows (register → login → invest)
- [ ] Fix bugs and edge cases
- [ ] Add loading states and error handling
- [ ] Improve UI/UX (responsive design)
- [ ] Add form validation feedback
- [ ] Test authorization (users can't edit others' data)

### Key Areas to Test:
1. **Authentication**: Register, login, protected routes
2. **Startups**: Create, edit, delete, view
3. **Campaigns**: Create, publish, fund progress
4. **Investments**: Make investment, calculate equity, validate limits
5. **Portfolio**: View investments, equity holdings

---

## Completion Checklist

By end of Week 2, you should have:
- ✅ Working authentication system
- ✅ Startup creation and management
- ✅ Fundraising campaigns
- ✅ Investment processing with equity calculation
- ✅ User dashboards (investor & founder)
- ✅ Portfolio tracking
- ✅ Responsive UI with basic styling

---

## Next Steps

Once the core platform is complete, move to **Week 3: AI Features**

See [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md) for step-by-step AI/RAG implementation.

---

## Tips for Success

### Backend Development
- Use Drizzle Studio to inspect database: `npm run db:studio`
- Test APIs with REST client before building frontend
- Use middleware for common tasks (auth, validation)
- Keep business logic in services, not controllers
- Use transactions for multi-step operations

### Frontend Development
- Build reusable components (Button, Card, Form, etc.)
- Use React Hook Form for complex forms
- Implement optimistic updates for better UX
- Add loading skeletons while fetching data
- Handle errors gracefully with toast notifications

### Database
- Always use Drizzle migrations (don't manually edit DB)
- Add indexes for frequently queried fields
- Use foreign keys for data integrity
- Back up your database before major changes

### Git Workflow
- Commit after each feature/task
- Use meaningful commit messages
- Create branches for major features (optional for learning)
- Push regularly to avoid losing work

---

**Ready for AI?** Once Week 1-2 is complete, proceed to [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md)!
