# Node 20, because NestJS 11 needs it. On Node 18 there is no global `crypto`,
# and @nestjs/typeorm reaches for `crypto.randomUUID()` while the database
# module is still being loaded: the container dies with `ReferenceError: crypto
# is not defined` before it opens a port, so the health check never passes and
# admin-web never starts. CI and the admin-web image are on 20 already.
#
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies required for building
RUN npm ci

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files and built application
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create necessary directories
RUN mkdir -p ./logs ./uploads && chown -R nodejs:nodejs ./logs ./uploads

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (r) => {if(r.statusCode !== 200) throw new Error()})"

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
