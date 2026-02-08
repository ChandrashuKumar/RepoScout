import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import fs from 'fs-extra';

// Load environment variables
dotenv.config();

import './lib/passport';

// Import routes
import authRoutes from './routes/authRoutes';
import repoRoutes from './routes/repoRoutes';
import ingestRoutes from './routes/ingestRoutes';
import qaRoutes from './routes/qaRoutes';

const app = express();
const PORT = process.env.PORT || 5555;

app.set("trust proxy", 1);

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());

// Session configuration (required for Passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoints
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'RepoScout API Server Running', status: 'ok' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/chat', qaRoutes);

// Cleanup temp directory on startup
const cleanupTempDir = async () => {
  const tempPath = path.join(__dirname, '../temp');
  try {
    await fs.ensureDir(tempPath);
    await fs.emptyDir(tempPath);
    console.log(`[Server] Temp directory cleared: ${tempPath}`);
  } catch (error) {
    console.error('[Server] Temp cleanup failed:', error);
  }
};

// Start server after cleanup
cleanupTempDir().then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });
});
