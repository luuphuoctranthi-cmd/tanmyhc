import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'system_database.json');

// Ensure data directory exists on disk
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Support large payloads (for base64 videos, files, and rich records)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Helper to read database safely
function readDatabase(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return null;
}

// Helper to write database safely with atomic swap
function writeDatabase(data: any): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/api/system/status', (req: Request, res: Response) => {
  const data = readDatabase();
  const lastUpdated = data?.lastUpdated || 0;
  res.json({
    status: 'ok',
    storage: 'permanent_disk',
    lastUpdated,
    timestamp: Date.now(),
    counts: {
      procedures: data?.procedures?.length || 0,
      news: data?.news?.length || 0,
      schedules: data?.schedules?.length || 0,
      feedbacks: data?.feedbacks?.length || 0,
      trafficReports: data?.trafficReports?.length || 0
    }
  });
});

app.get('/api/system/data', (req: Request, res: Response) => {
  const data = readDatabase();
  if (data) {
    return res.json(data);
  }
  // Return empty structure if not yet seeded
  return res.json({ procedures: [], lastUpdated: 0 });
});

app.post('/api/system/data', (req: Request, res: Response) => {
  try {
    const incomingData = req.body;
    if (!incomingData || typeof incomingData !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const existing = readDatabase() || {};
    const updated = {
      ...existing,
      ...incomingData,
      lastUpdated: incomingData.lastUpdated || Date.now()
    };

    const success = writeDatabase(updated);
    if (success) {
      return res.json({
        success: true,
        lastUpdated: updated.lastUpdated
      });
    } else {
      return res.status(500).json({ error: 'Failed to write to persistent storage' });
    }
  } catch (err: any) {
    console.error('POST /api/system/data error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/reset', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    res.json({ success: true, message: 'Database reset to factory default' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev server in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ward Tan My Smart Assistant Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
