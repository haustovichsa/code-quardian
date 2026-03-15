# Base stage - common dependencies
FROM node:20-slim AS base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev deps for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production dependencies only
RUN npm ci --omit=dev

# API stage
FROM node:20-slim AS api

WORKDIR /app

# Copy built files and production dependencies from base
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Expose API port
EXPOSE 3000

# Run API server
CMD ["node", "dist/rest-api-server.js"]

# GraphQL stage
FROM node:20-slim AS graphql

WORKDIR /app

# Copy built files and production dependencies from base
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Expose GraphQL port
EXPOSE 4000

# Run GraphQL server
CMD ["node", "dist/graphql-server.js"]

# Worker stage - includes Trivy and Git
FROM node:20-slim AS worker

# Install Trivy and git
RUN apt-get update && apt-get install -y git curl && \
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin && \
    trivy --version && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built files and production dependencies from base
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Run worker
CMD ["node", "dist/worker.js"]
