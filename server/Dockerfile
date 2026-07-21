# ================================
# Visuals.co API — Production Dockerfile
# Multi-stage build for Google Cloud Run
# ================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 2: Production runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY app.js ./
COPY server.js ./
COPY swaggerOptions.js ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY middlewares/ ./middlewares/
COPY routes/ ./routes/
COPY utils/ ./utils/
COPY scripts/ ./scripts/

# Switch to non-root user
USER expressjs

# Cloud Run injects PORT env var
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
