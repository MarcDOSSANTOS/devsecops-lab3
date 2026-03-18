# ✅ Multi-stage build for smaller image size
FROM node:22-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ==================
# Production stage
# ==================
FROM node:22-alpine

WORKDIR /app

# ✅ Security: Copy from builder (avoid unnecessary files)
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY server.js .
COPY package.json .

# ✅ Create non-root user for container
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# ✅ Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# ✅ Run application
CMD ["node", "server.js"]
