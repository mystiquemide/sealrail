# SealRail Backend - Railway Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy just package files first for layer caching
COPY backend/package.json backend/package-lock.json ./

RUN npm ci

# Copy source and build
COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

# Prune dev deps after build for smaller image
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Volume mount for persistent DB
VOLUME /data

EXPOSE 3001

CMD ["node", "dist/index.js"]
