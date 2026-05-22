# Stage 1: Build the Nuxt application
FROM node:20 AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (better-sqlite3 requires compilation via build-essential/python)
RUN npm ci

# Copy all source code
COPY . .

# Build the Nuxt 3 standalone application
RUN npm run build

# Stage 2: Optimized production runtime image
FROM node:20-slim AS runner

WORKDIR /app

# Install fallback runtime utilities if needed
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Set production environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# Copy the bundled server build
COPY --from=builder /app/.output ./.output

# Expose port 8080 (Google Cloud Run default port)
EXPOSE 8080

# Start Nuxt standalone Nitro server
CMD ["node", ".output/server/index.mjs"]
