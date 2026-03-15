# 🚀 Deployment Guide — ArduinoAI IDE

This guide covers every way to host ArduinoAI IDE as a **live public URL** that anyone can open and start building.

---

## Architecture Overview

```
User's Browser
      │
      ▼
   Your Host  (Netlify / Vercel / Railway / VPS / Docker)
      │
      ├── /              → serves built React app (dist/)
      ├── /api/claude    → serverless/Express proxy
      │        │
      │        └──────▶  api.anthropic.com  (Claude AI)
      │
      └── /api/health    → health check endpoint
```

The proxy is the key piece — it means your users' API keys travel over **HTTPS to your own server**, never exposed in browser network logs to third parties.

---

## Option 1 — Netlify (Recommended · Free · 1-click)

### Step 1 — Connect repo

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Choose your GitHub repo: `roboticist-blip/Arduino-AI-IDE`
3. Netlify auto-detects the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish dir: `dist`
   - Functions dir: `netlify/functions`

### Step 2 — Set environment variables (optional)

In **Site settings → Environment variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Optional. If set, users don't need their own key. |
| `NODE_VERSION` | `20` | Already in netlify.toml |

> If you don't set `ANTHROPIC_API_KEY`, users enter their own key in the app — it's sent in the `X-User-Api-Key` header to your Netlify function, which forwards it to Anthropic.

### Step 3 — Deploy

Click **Deploy site**. Your live URL appears in ~2 minutes:
```
https://your-site-name.netlify.app
```

### Custom domain

Site settings → Domain management → Add custom domain → follow DNS steps.

---

## Option 2 — Vercel (Free · Fastest CDN)

### Step 1 — Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `roboticist-blip/Arduino-AI-IDE`
3. Framework: **Vite** (auto-detected)

### Step 2 — Environment variables

In Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (optional) |

### Step 3 — Deploy

Click **Deploy**. Live in ~90 seconds at:
```
https://arduino-ai-ide.vercel.app
```

---

## Option 3 — Railway (Free tier · Full server)

Railway runs the Express server (`server/index.js`) which serves both the built app and the proxy.

### Steps

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `Arduino-AI-IDE` repo
3. Add environment variable: `ANTHROPIC_API_KEY=sk-ant-...` (optional)
4. Railway detects `package.json` and uses `npm start` (`build` + `server`)

Live URL: `https://arduino-ai-ide-production.up.railway.app`

---

## Option 4 — Docker (Self-hosted / VPS)

### Quick start (pre-built)

```bash
# Build the image
docker build -t arduino-ai-ide .

# Run (user-key mode — users provide their own key)
docker run -p 3000:3000 arduino-ai-ide

# Run (server-key mode — you provide the key, users just use the app)
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-your-key \
  arduino-ai-ide
```

### Docker Compose

```bash
# Edit docker-compose.yml and uncomment ANTHROPIC_API_KEY if desired
docker compose up -d

# View logs
docker compose logs -f

# Update
docker compose pull && docker compose up -d
```

App runs at `http://your-server:3000`

---

## Option 5 — VPS / Bare Metal (nginx + PM2)

For a Ubuntu 22.04 VPS (DigitalOcean, Linode, Hetzner, etc.):

### Install dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx

# PM2 process manager
sudo npm install -g pm2
```

### Clone and build

```bash
git clone https://github.com/roboticist-blip/Arduino-AI-IDE.git
cd Arduino-AI-IDE
npm install --legacy-peer-deps
npm run build
```

### Start with PM2

```bash
# Optional: set server key
export ANTHROPIC_API_KEY=sk-ant-your-key

# Start
pm2 start server/index.js --name arduino-ai-ide
pm2 save
pm2 startup   # auto-start on reboot
```

### nginx reverse proxy

```nginx
# /etc/nginx/sites-available/arduino-ai-ide
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/arduino-ai-ide /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS (free SSL)
sudo certbot --nginx -d your-domain.com
```

---

## GitHub Actions (Auto-deploy on push)

The `.github/workflows/deploy.yml` auto-deploys to Netlify/Vercel on every push to `main`.

Add these **GitHub repository secrets** (Settings → Secrets and variables → Actions):

### For Netlify auto-deploy:
| Secret | Where to find it |
|--------|-----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site settings → General → Site ID |

### For Vercel auto-deploy:
| Secret | Where to find it |
|--------|-----------------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General |

Once set, every `git push origin main` triggers a fresh deploy automatically.

---

## API Key Modes

The app supports two modes simultaneously:

### User-key mode (default — no server config needed)
- Users open the app → prompted for their own Anthropic API key
- Key stored in `localStorage` (browser only, never leaves their machine except to go to Anthropic via your proxy)
- Great for open hosting — you pay nothing for AI usage

### Server-key mode (set `ANTHROPIC_API_KEY` env var)
- You set the key on the server
- Users just open the URL and start building — no key required
- You pay for all AI usage
- Great for team/internal tools

Both modes work at the same time: server key is used if set, otherwise user's key from the header is used.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | No | — | Server-side Claude API key. If set, users don't need their own. |
| `PORT` | No | `3000` | Port for Express server |
| `NODE_ENV` | No | `development` | Set to `production` in hosting |
| `VITE_ANTHROPIC_API_KEY` | No | — | Bake a key into the frontend at build time (not recommended for public hosting) |

---

## Updating the deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Restart server (PM2)
pm2 restart arduino-ai-ide

# Or restart Docker
docker compose up -d --build
```

For Netlify/Vercel: just `git push` — CI/CD handles the rest.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No API key configured" | Set `ANTHROPIC_API_KEY` env var OR user enters key in app |
| CORS errors | Make sure you're going through `/api/claude` not calling Anthropic directly |
| Build fails `Cannot resolve monaco-editor` | Use the fixed `vite.config.js` (manual chunk removed) |
| Web Serial upload doesn't work | Normal — this needs Chrome/Edge. Works in any browser for AI generation. |
| 404 on refresh | Check SPA redirect rules (`netlify.toml` / `vercel.json` already handle this) |
| Netlify functions 404 | Ensure `netlify/functions/` dir is committed and `netlify.toml` is present |
