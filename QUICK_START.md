# Quick Start Guide

Get your CapitalX project up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Create Project Structure

```bash
# Create main folders
mkdir -p frontend backend ai-service docs

# Copy documentation
# (All .md files are in root directory)
```

### 2. Initialize Backend

```bash
cd backend
npm init -y

# Install dependencies
npm install express drizzle-orm postgres dotenv zod bcrypt jsonwebtoken
npm install -D typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken tsx drizzle-kit

# Initialize TypeScript
npx tsc --init

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/capitalx
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
NODE_ENV=development
EOF

# Create database
createdb capitalx
```

### 3. Initialize Frontend

```bash
cd ../frontend

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install additional dependencies
npm install zod

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_AI_URL=http://localhost:3002/api/ai
EOF
```

### 4. Initialize AI Service

```bash
cd ../ai-service
npm init -y

# Install AI dependencies
npm install express langchain @langchain/ollama @langchain/qdrant
npm install pdf-parse mammoth dotenv cors multer
npm install -D typescript @types/node @types/express @types/multer tsx

# Initialize TypeScript
npx tsc --init

# Create .env
cat > .env << EOF
OLLAMA_BASE_URL=http://localhost:11434
QDRANT_URL=http://localhost:6333
PORT=3002
EOF
```

### 5. Install Ollama

```bash
# Linux/Mac
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3.1
ollama pull nomic-embed-text

# Verify
ollama list
```

### 6. Start Qdrant

```bash
# Using Docker
docker run -d -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  --name qdrant \
  qdrant/qdrant

# Verify
curl http://localhost:6333
```

### 7. Set Up Database Schema

```bash
cd backend

# Create Drizzle config
cat > drizzle.config.ts << 'EOF'
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
EOF

# Create schema file (see DATABASE_SCHEMA.md for full schema)
mkdir -p src/models
# Copy schema from DATABASE_SCHEMA.md to src/models/schema.ts

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate
```

### 8. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: AI Service (Week 3)
cd ai-service
npm run dev
```

### 9. Verify Everything Works

```bash
# Check backend
curl http://localhost:3001/health

# Check frontend
open http://localhost:3000

# Check AI service (Week 3)
curl http://localhost:3002/health
```

## Development Workflow

### Week 1-2: Core Platform

Follow [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed tasks:

1. **Day 1-2**: Database setup, authentication
2. **Day 3-4**: Startup management
3. **Day 5-7**: Campaigns
4. **Day 8-10**: Investments
5. **Day 11-14**: Portfolio, polish

### Week 3: AI Features

Follow [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md):

1. **Day 1-2**: Document Q&A System
2. **Day 3-4**: Startup Analysis
3. **Day 5-7**: Investment Chatbot

## Useful Commands

### Backend

```bash
# Development
npm run dev

# Database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database

# Testing
npm test
```

### Frontend

```bash
# Development
npm run dev

# Build
npm run build
npm start

# Lint
npm run lint
```

### AI Service

```bash
# Development
npm run dev

# Test Ollama connection
curl http://localhost:11434/api/tags

# Test Qdrant
curl http://localhost:6333/collections
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001
lsof -i :3000
lsof -i :3002

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Verify connection
psql -U postgres -d capitalx
```

### Ollama Not Running

```bash
# Check Ollama status
ollama list

# Start Ollama (usually runs as service)
# Linux: systemctl start ollama
# Mac: Runs automatically after install
```

### Qdrant Not Accessible

```bash
# Check Docker container
docker ps

# Restart Qdrant
docker restart qdrant

# Check logs
docker logs qdrant
```

## Next Steps

1. ✅ Complete setup (you are here!)
2. 📖 Read [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
3. 💻 Start coding Week 1-2 features
4. 🤖 Follow [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md) for Week 3
5. 📚 Reference [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) and [API_DOCS.md](./API_DOCS.md) as needed

## Tips for Success

- **Commit often**: After each feature
- **Test as you go**: Don't wait until the end
- **Read the guides**: They have detailed explanations
- **Ask questions**: Understanding > Speed
- **Have fun**: You're building something awesome!

## Getting Help

If you get stuck:

1. Check the documentation files
2. Review error messages carefully
3. Search for similar issues
4. Debug step by step
5. Take breaks when frustrated

## Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Next.js**: https://nextjs.org/docs
- **LangChain**: https://js.langchain.com/docs
- **Ollama**: https://ollama.ai/
- **Qdrant**: https://qdrant.tech/documentation/

---

**You're all set!** 🚀 Start building with [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
