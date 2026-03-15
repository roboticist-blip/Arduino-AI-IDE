# ─── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production server deps
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev express

# Copy built frontend and server
COPY --from=builder /app/dist ./dist
COPY server ./server

EXPOSE 3000

# Optional: set ANTHROPIC_API_KEY at runtime for server-key mode
# docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 3000:3000 arduino-ai-ide
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server/index.js"]
