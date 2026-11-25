# Node 22, the maintained LTS line. Node 20 left support in April 2026, so it
# no longer gets security fixes. NestJS 11 needs at least 20: on Node 18 there
# is no global `crypto`, and @nestjs/typeorm reaches for `crypto.randomUUID()`
# while the database module is still being loaded; the container died with
# `ReferenceError: crypto is not defined` before it opened a port. CI, the
# admin-web image and the full test run of 2026-10-28 are on 22 as well.
#
# Build stage
FROM node:22-alpine AS builder

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
FROM node:22-alpine

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
