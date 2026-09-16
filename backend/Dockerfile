FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy prisma schema for generation
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Default command (overridden in docker-compose.override.yml for dev)
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/server.ts"]
