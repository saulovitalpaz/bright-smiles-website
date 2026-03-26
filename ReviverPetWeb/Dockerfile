# Stage 1: Build the Vite React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend dependencies and build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy frontend source
COPY frontend/ .
RUN npm run build

# Stage 2: Serve with FastAPI
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies specifically for Linux/production
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy the backend code
COPY backend/ backend/

# Copy the built frontend into the location expected by main.py
# main.py expects it at: BASE_DIR/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Railway passes the PORT environment variable. We set a default for local docker testing.
ENV PORT=8000
EXPOSE $PORT

# Run the FastAPI application using uvicorn
CMD uvicorn backend.main:app --host 0.0.0.0 --port $PORT
