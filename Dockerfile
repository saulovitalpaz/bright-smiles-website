# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with a lightweight server
FROM node:20-alpine

WORKDIR /app

# Install 'serve' package globally to serve static files
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the server (serve 'dist' folder on port 3000, SPA mode)
CMD ["serve", "-s", "dist", "-l", "3000"]
