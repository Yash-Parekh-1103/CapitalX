# Database Schema

Complete database schema for CapitalX with PostgreSQL tables and Zod validation schemas.

---

## Overview

**Database**: PostgreSQL 14+  
**ORM**: Drizzle ORM  
**Validation**: Zod

### Schema Organization

```
Core Tables:
- users (investors & founders)
- startups (company profiles)
- campaigns (fundraising rounds)
- investments (transaction records)
- equity_holdings (ownership tracking)

Document Management:
- documents (uploaded files)
- document_chunks (for RAG)

AI Features:
- conversations (chat sessions)
- chat_messages (chat history)
- analyses (AI-generated reports)
```

---

## Core Tables

### 1. Users Table

```typescript
// backend/src/models/schema.ts
import { pgTable, uuid, text, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['investor', 'founder', 'admin'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('investor'),
  bio: text('bio'),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod Schema for Validation
import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['investor', 'founder', 'admin']).default('investor'),
  bio: z.string().optional(),
  profileImage: z.string().url().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const updateUserSchema = userSchema.partial().omit({ password: true })

// Type inference
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

**Sample Data:**
```sql
INSERT INTO users (email, password_hash, name, role) VALUES
('john@investor.com', '$2b$10$...', 'John Investor', 'investor'),
('jane@startup.com', '$2b$10$...', 'Jane Founder', 'founder');
```

---

### 2. Startups Table

```typescript
import { integer, numeric, jsonb } from 'drizzle-orm/pg-core'

export const startupStageEnum = pgEnum('startup_stage', [
  'idea',
  'mvp',
  'early_revenue',
  'growth',
  'scaling'
])

export const startups = pgTable('startups', {
  id: uuid('id').primaryKey().defaultRandom(),
  founderId: uuid('founder_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  tagline: varchar('tagline', { length: 500 }),
  description: text('description').notNull(),
  logo: text('logo'),
  coverImage: text('cover_image'),
  industry: varchar('industry', { length: 100 }),
  stage: startupStageEnum('stage').notNull(),
  foundedYear: integer('founded_year'),
  website: text('website'),
  location: varchar('location', { length: 255 }),
  teamSize: integer('team_size'),
  
  // Social links
  socialLinks: jsonb('social_links').$type<{
    linkedin?: string
    twitter?: string
    github?: string
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod Schema
export const startupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  tagline: z.string().max(500).optional(),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  industry: z.string().optional(),
  stage: z.enum(['idea', 'mvp', 'early_revenue', 'growth', 'scaling']),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  website: z.string().url().optional(),
  location: z.string().optional(),
  teamSize: z.number().int().positive().optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    github: z.string().url().optional(),
  }).optional(),
})

export const updateStartupSchema = startupSchema.partial()

export type Startup = typeof startups.$inferSelect
export type NewStartup = typeof startups.$inferInsert
```

---

### 3. Campaigns Table

```typescript
import { boolean, decimal } from 'drizzle-orm/pg-core'

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'funded',
  'closed',
  'cancelled'
])

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  startupId: uuid('startup_id').references(() => startups.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  // Funding details
  fundingGoal: decimal('funding_goal', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  minInvestment: decimal('min_investment', { precision: 15, scale: 2 }).notNull(),
  maxInvestment: decimal('max_investment', { precision: 15, scale: 2 }).notNull(),
  
  // Equity
  equityOffered: decimal('equity_offered', { precision: 5, scale: 2 }).notNull(), // Percentage
  pricePerShare: decimal('price_per_share', { precision: 10, scale: 2 }),
  totalShares: integer('total_shares'),
  
  // Timeline
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date').notNull(),
  
  // Status
  status: campaignStatusEnum('status').default('draft').notNull(),
  
  // Metrics
  investorCount: integer('investor_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod Schema
export const campaignSchema = z.object({
  startupId: z.string().uuid(),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  fundingGoal: z.number().positive('Funding goal must be positive'),
  minInvestment: z.number().positive('Minimum investment must be positive'),
  maxInvestment: z.number().positive('Maximum investment must be positive'),
  equityOffered: z.number().min(0.01).max(100, 'Equity must be between 0.01% and 100%'),
  pricePerShare: z.number().positive().optional(),
  totalShares: z.number().int().positive().optional(),
  endDate: z.string().datetime(),
  status: z.enum(['draft', 'active', 'funded', 'closed', 'cancelled']).default('draft'),
}).refine(
  data => data.maxInvestment >= data.minInvestment,
  { message: 'Maximum investment must be greater than minimum', path: ['maxInvestment'] }
)

export const updateCampaignSchema = campaignSchema.partial()

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
```

---

### 4. Investments Table

```typescript
export const investmentStatusEnum = pgEnum('investment_status', [
  'pending',
  'completed',
  'failed',
  'refunded'
])

export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  investorId: uuid('investor_id').references(() => users.id).notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  startupId: uuid('startup_id').references(() => startups.id).notNull(),
  
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  equityPercentage: decimal('equity_percentage', { precision: 8, scale: 4 }).notNull(),
  sharesReceived: integer('shares_received'),
  
  status: investmentStatusEnum('status').default('pending').notNull(),
  
  // Payment info (simplified for now)
  paymentMethod: varchar('payment_method', { length: 50 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  
  investedAt: timestamp('invested_at').defaultNow().notNull(),
  
  // Metadata
  metadata: jsonb('metadata').$type<{
    userAgent?: string
    ipAddress?: string
    notes?: string
  }>(),
})

// Zod Schema
export const investmentSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().positive('Investment amount must be positive'),
  paymentMethod: z.string().optional(),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
})

export type Investment = typeof investments.$inferSelect
export type NewInvestment = typeof investments.$inferInsert
```

---

### 5. Equity Holdings Table

```typescript
export const equityHoldings = pgTable('equity_holdings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startupId: uuid('startup_id').references(() => startups.id).notNull(),
  
  equityPercentage: decimal('equity_percentage', { precision: 8, scale: 4 }).notNull(),
  shares: integer('shares'),
  
  // Aggregated from all investments
  totalInvested: decimal('total_invested', { precision: 15, scale: 2 }).notNull(),
  
  // Calculated valuation
  currentValue: decimal('current_value', { precision: 15, scale: 2 }),
  
  acquiredAt: timestamp('acquired_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Indexes for performance
export const equityHoldingsIndex = pgIndex('equity_holdings_user_startup_idx')
  .on(equityHoldings.userId, equityHoldings.startupId)

export type EquityHolding = typeof equityHoldings.$inferSelect
export type NewEquityHolding = typeof equityHoldings.$inferInsert
```

---

## Document Management Tables

### 6. Documents Table

```typescript
export const documentTypeEnum = pgEnum('document_type', [
  'pitch_deck',
  'business_plan',
  'financial_statement',
  'legal_document',
  'other'
])

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  startupId: uuid('startup_id').references(() => startups.id).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  type: documentTypeEnum('type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'), // bytes
  mimeType: varchar('mime_type', { length: 100 }),
  
  // AI Processing
  isProcessed: boolean('is_processed').default(false),
  chunkCount: integer('chunk_count'),
  
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
})

// Zod Schema
export const documentSchema = z.object({
  startupId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['pitch_deck', 'business_plan', 'financial_statement', 'legal_document', 'other']),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
})

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
```

---

### 7. Document Chunks Table (for RAG)

```typescript
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  startupId: uuid('startup_id').references(() => startups.id).notNull(),
  
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  
  // Vector embedding (stored in Qdrant, reference here)
  embeddingId: varchar('embedding_id', { length: 255 }),
  
  // Metadata for retrieval
  metadata: jsonb('metadata').$type<{
    page?: number
    section?: string
    tokens?: number
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type DocumentChunk = typeof documentChunks.$inferSelect
export type NewDocumentChunk = typeof documentChunks.$inferInsert
```

---

## AI Features Tables

### 8. Conversations Table

```typescript
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startupId: uuid('startup_id').references(() => startups.id), // Optional: conversation about specific startup
  
  title: varchar('title', { length: 255 }), // Auto-generated from first message
  messageCount: integer('message_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert
```

---

### 9. Chat Messages Table

```typescript
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system'])

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  
  // Metadata
  metadata: jsonb('metadata').$type<{
    sources?: Array<{
      documentId: string
      content: string
      similarity: number
    }>
    tokensUsed?: number
    model?: string
    latency?: number
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Zod Schema
export const chatMessageSchema = z.object({
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  metadata: z.object({
    sources: z.array(z.object({
      documentId: z.string(),
      content: z.string(),
      similarity: z.number(),
    })).optional(),
    tokensUsed: z.number().optional(),
    model: z.string().optional(),
  }).optional(),
})

export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert
```

---

### 10. Analyses Table (AI-Generated Reports)

```typescript
export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  startupId: uuid('startup_id').references(() => startups.id).notNull(),
  generatedBy: uuid('generated_by').references(() => users.id), // Optional: user who requested
  
  // Analysis results
  marketAnalysis: text('market_analysis'),
  businessModelAnalysis: text('business_model_analysis'),
  financialAnalysis: text('financial_analysis'),
  riskAssessment: text('risk_assessment'),
  recommendation: text('recommendation'),
  
  // Structured output
  rating: integer('rating'), // 1-10
  recommendationType: varchar('recommendation_type', { length: 50 }), // strong_buy, buy, hold, avoid
  
  // Metadata
  documentsAnalyzed: jsonb('documents_analyzed').$type<string[]>(), // Document IDs
  modelUsed: varchar('model_used', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Zod Schema
export const analysisResultSchema = z.object({
  marketAnalysis: z.string(),
  businessModelAnalysis: z.string(),
  financialAnalysis: z.string(),
  riskAssessment: z.string(),
  recommendation: z.string(),
  rating: z.number().int().min(1).max(10).optional(),
  recommendationType: z.enum(['strong_buy', 'buy', 'hold', 'avoid']).optional(),
})

export type Analysis = typeof analyses.$inferSelect
export type NewAnalysis = typeof analyses.$inferInsert
```

---

## Relationships

```
users (1) ──────< (many) startups
users (1) ──────< (many) investments
users (1) ──────< (many) equityHoldings
users (1) ──────< (many) conversations

startups (1) ───< (many) campaigns
startups (1) ───< (many) documents
startups (1) ───< (many) investments
startups (1) ───< (many) equityHoldings
startups (1) ───< (many) analyses

campaigns (1) ──< (many) investments

documents (1) ──< (many) documentChunks

conversations (1) < (many) chatMessages
```

---

## Database Migrations

### Generate Migrations

```bash
cd backend
npm run db:generate
# Creates migration files in drizzle/ directory
```

### Example Migration

```typescript
// drizzle/0000_initial_schema.sql
CREATE TYPE "user_role" AS ENUM('investor', 'founder', 'admin');
CREATE TYPE "startup_stage" AS ENUM('idea', 'mvp', 'early_revenue', 'growth', 'scaling');
CREATE TYPE "campaign_status" AS ENUM('draft', 'active', 'funded', 'closed', 'cancelled');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'investor',
  "bio" TEXT,
  "profile_image" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "startups" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "founder_id" UUID NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR(255) NOT NULL,
  "tagline" VARCHAR(500),
  "description" TEXT NOT NULL,
  "logo" TEXT,
  "cover_image" TEXT,
  "industry" VARCHAR(100),
  "stage" "startup_stage" NOT NULL,
  "founded_year" INTEGER,
  "website" TEXT,
  "location" VARCHAR(255),
  "team_size" INTEGER,
  "social_links" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_startups_founder_id" ON "startups"("founder_id");
CREATE INDEX "idx_campaigns_startup_id" ON "campaigns"("startup_id");
CREATE INDEX "idx_investments_investor_id" ON "investments"("investor_id");
CREATE INDEX "idx_investments_campaign_id" ON "investments"("campaign_id");

-- Continue for all tables...
```

### Run Migrations

```bash
npm run db:migrate
```

---

## Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config()

export default {
  schema: './src/models/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

---

## Database Seeds (Optional)

```typescript
// backend/src/db/seed.ts
import { db } from './index'
import { users, startups, campaigns } from '../models/schema'
import bcrypt from 'bcrypt'

async function seed() {
  console.log('🌱 Seeding database...')
  
  // Create users
  const [investor, founder] = await db.insert(users).values([
    {
      email: 'investor@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'John Investor',
      role: 'investor',
    },
    {
      email: 'founder@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Jane Founder',
      role: 'founder',
    }
  ]).returning()
  
  // Create startup
  const [startup] = await db.insert(startups).values({
    founderId: founder.id,
    name: 'TechStartup Inc',
    tagline: 'Revolutionizing the industry',
    description: 'We are building the future of technology...',
    industry: 'Technology',
    stage: 'mvp',
    foundedYear: 2024,
  }).returning()
  
  // Create campaign
  await db.insert(campaigns).values({
    startupId: startup.id,
    title: 'Seed Funding Round',
    description: 'Raising $500k for product development',
    fundingGoal: '500000',
    minInvestment: '1000',
    maxInvestment: '50000',
    equityOffered: '10',
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    status: 'active',
  })
  
  console.log('✅ Database seeded!')
}

seed()
```

Run seed:
```bash
npm run db:seed
```

---

## Queries with Drizzle

### Example Queries

```typescript
// Get user by email
const user = await db.query.users.findFirst({
  where: eq(users.email, 'investor@example.com')
})

// Get startup with founder
const startup = await db.query.startups.findFirst({
  where: eq(startups.id, startupId),
  with: {
    founder: true
  }
})

// Get campaign with investments
const campaign = await db.query.campaigns.findFirst({
  where: eq(campaigns.id, campaignId),
  with: {
    startup: true,
    investments: {
      with: {
        investor: true
      }
    }
  }
})

// Get user's portfolio
const portfolio = await db.query.equityHoldings.findMany({
  where: eq(equityHoldings.userId, userId),
  with: {
    startup: true
  }
})

// Complex query: Active campaigns with progress
const activeCampaigns = await db
  .select({
    id: campaigns.id,
    title: campaigns.title,
    fundingGoal: campaigns.fundingGoal,
    currentAmount: campaigns.currentAmount,
    progress: sql<number>`(${campaigns.currentAmount} / ${campaigns.fundingGoal} * 100)`,
    startup: startups,
  })
  .from(campaigns)
  .leftJoin(startups, eq(campaigns.startupId, startups.id))
  .where(eq(campaigns.status, 'active'))
```

---

## Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/capitalx
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development

# AI Service
OLLAMA_BASE_URL=http://localhost:11434
QDRANT_URL=http://localhost:6333
```

---

## Schema Summary

**Total Tables**: 10

**Core**: users, startups, campaigns, investments, equity_holdings  
**Documents**: documents, document_chunks  
**AI**: conversations, chat_messages, analyses

**Enums**: 5 (user_role, startup_stage, campaign_status, investment_status, document_type, message_role)

**Relationships**: Multiple one-to-many relationships with foreign keys

---

This schema provides a solid foundation for the CapitalX platform. You can extend it as needed when adding new features!
