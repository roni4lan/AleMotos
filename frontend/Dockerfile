FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Default command
CMD ["npx", "vite", "--host", "0.0.0.0"]
