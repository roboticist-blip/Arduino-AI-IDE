/**
 * ArduinoAI IDE — Self-Hosted Server
 * Express server that:
 *  1. Serves the built Vite dist/ as static files
 *  2. Proxies /api/claude → Anthropic API
 *  3. Falls back all routes to index.html (SPA)
 *
 * Usage:
 *   npm run server          # serve dist/ + proxy
 *   npm run dev:server      # proxy only (run alongside vite dev)
 *
 * Environment:
 *   PORT=3000
 *   ANTHROPIC_API_KEY=sk-ant-...   (optional server-side key)
 */

import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// ─── CORS middleware ──────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-User-Api-Key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Claude Proxy ─────────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  const serverKey = process.env.ANTHROPIC_API_KEY;
  const clientKey = req.headers['x-user-api-key'];
  const apiKey = serverKey || clientKey;

  if (!apiKey) {
    return res.status(401).json({
      error: 'No API key configured. Set ANTHROPIC_API_KEY env var or provide key in app.',
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[Proxy error]', err.message);
    res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
});

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    hasServerKey: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve built frontend ─────────────────────────────────────────
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath, {
  maxAge: '1y',
  immutable: true,
  // Don't cache index.html so new deploys are picked up
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────
createServer(app).listen(PORT, () => {
  console.log('\n🤖 ArduinoAI IDE Server running');
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Proxy:    /api/claude → api.anthropic.com`);
  console.log(`   Key mode: ${process.env.ANTHROPIC_API_KEY ? '🔑 Server key set' : '👤 User-supplied key'}\n`);
});
