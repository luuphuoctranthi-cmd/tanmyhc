import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

const apiStoragePlugin = (): Plugin => ({
  name: 'api-storage-plugin',
  configureServer(server) {
    const DATA_DIR = path.resolve(process.cwd(), 'data');
    const DB_FILE = path.resolve(DATA_DIR, 'system_database.json');

    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/system/')) {
        return next();
      }

      if (req.url.startsWith('/api/system/status')) {
        let lastUpdated = 0;
        let counts = {};
        if (fs.existsSync(DB_FILE)) {
          try {
            const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
            lastUpdated = data.lastUpdated || 0;
            counts = {
              procedures: data.procedures?.length || 0,
              news: data.news?.length || 0,
              schedules: data.schedules?.length || 0,
              feedbacks: data.feedbacks?.length || 0,
              trafficReports: data.trafficReports?.length || 0
            };
          } catch (e) {
            console.error('Error reading DB status:', e);
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'ok',
          storage: 'permanent_disk',
          lastUpdated,
          timestamp: Date.now(),
          counts
        }));
        return;
      }

      if (req.url.startsWith('/api/system/data') && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        if (fs.existsSync(DB_FILE)) {
          try {
            const content = fs.readFileSync(DB_FILE, 'utf-8');
            res.end(content);
            return;
          } catch (err) {
            console.error('Error reading db in vite plugin:', err);
          }
        }
        res.end(JSON.stringify({ procedures: [], lastUpdated: 0 }));
        return;
      }

      if (req.url.startsWith('/api/system/data') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            if (!fs.existsSync(DATA_DIR)) {
              fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            const incoming = JSON.parse(body);
            let existing: any = {};
            if (fs.existsSync(DB_FILE)) {
              try { existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch {}
            }
            const updated = {
              ...existing,
              ...incoming,
              lastUpdated: incoming.lastUpdated || Date.now()
            };
            const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
            fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
            fs.renameSync(tempFile, DB_FILE);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, lastUpdated: updated.lastUpdated }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      if (req.url.startsWith('/api/system/reset') && req.method === 'POST') {
        if (fs.existsSync(DB_FILE)) {
          fs.unlinkSync(DB_FILE);
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
        return;
      }

      next();
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiStoragePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    },
  };
});
