# RepoScout

An AI-powered tool for exploring and understanding GitHub repositories. Paste a repo URL, and RepoScout will clone, parse, and index the codebase — then let you chat with it using natural language.

## Features

- **Repository Ingestion** — Paste any GitHub URL to automatically clone, parse, and index the codebase with real-time progress via SSE
- **Smart Chunking** — TypeScript AST-based code parsing that splits source files into functions, classes, and modules for precise retrieval
- **Semantic Search** — RAG pipeline using vector embeddings (HuggingFace) stored in PostgreSQL with pgvector
- **Interactive Graph** — Explore the repository's file structure as a 2D node graph (React Flow) with syntax-highlighted code previews
- **Multi-LLM Chat** — Ask questions about the codebase in plain English, switch between Gemini and Groq on the fly
- **Private Repo Support** — Sign in with GitHub to analyze your private repositories
- **Export Chat** — Download your conversation as a Markdown file

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Flow, Framer Motion

**Backend:** Node.js, Express, Prisma, PostgreSQL (Supabase), Passport.js

**AI/ML:** Google Gemini, Groq (Llama), HuggingFace Inference API, pgvector

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database with pgvector extension (e.g. Supabase)
- Git installed on the server
- API keys for Gemini, Groq, and HuggingFace

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-username/RepoScout.git
cd RepoScout
```

2. **Server**

```bash
cd reposcout-server
npm install
```

Create a `.env` file:

```env
PORT=5555
FRONTEND_URL=http://localhost:5173
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
HUGGINGFACE_ACCESS_TOKEN=your_hf_token
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:5555/auth/github/callback
```

Push the schema to the database and start:

```bash
npx prisma db push
npm run dev
```

3. **Client**

```bash
cd reposcout-client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5555
```

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

## Project Structure

```
RepoScout/
├── reposcout-client/          # React frontend
│   ├── src/
│   │   ├── components/        # UI components (ChatPanel, CodeViewer, RepoGraph, etc.)
│   │   ├── pages/             # Route pages (Intro, Auth, Dashboard, Repo)
│   │   ├── store/             # Zustand stores (useAppStore, useChatStore)
│   │   └── services/          # API client (axios)
│   └── ...
├── reposcout-server/          # Express backend
│   ├── src/
│   │   ├── controllers/       # Route handlers (auth, ingest, QA)
│   │   ├── services/          # Business logic (chunking, AI, GitHub)
│   │   ├── routes/            # Express routes
│   │   ├── middleware/        # Auth middleware (JWT)
│   │   └── lib/               # Prisma client, Passport config, event emitter
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── ...
└── README.md
```
