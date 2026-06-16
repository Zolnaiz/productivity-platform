FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_ENABLE_DEMO_MODE=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_DEMO_MODE=$VITE_ENABLE_DEMO_MODE

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:3001/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
