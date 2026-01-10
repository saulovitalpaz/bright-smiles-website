# System Overview & Deployment Guide

## 1. System Summary (Current State)

**Status:** Client-Side Single Page Application (SPA)
**Framework:** Vite + React + TypeScript
**Styling:** Tailwind CSS + Shadcn/UI
**Data Source:** **Static/Mock Data** (Located in `src/data/posts.ts`, hardcoded login in `AdminLogin.tsx`).
**Authentication:** **Simulation Only** (Credentials are hardcoded in the frontend code).
**Backend:** **None**. There is currently no active server-side logic or database connection in this repository.

> **Crucial Note:** The current system acts as a static brochure. "saving" a post or "registering" a patient currently only affects the local session or does nothing. Data will reset when the page is reloaded or the site is redeployed.

---

## 2. Database System & Data Transmission

You asked: *"I need to understand the database system, how data is stored and transmitted. What needs to be done in that part?"*

### A. How Data is Stored (The "Database")

**Current:**
-   Arrays in TypeScript files (e.g., `src/data/posts.ts`).
-   Browser `localStorage` (used for session tokens in `AdminLogin.tsx`).

**What Needs to be Done:**
You need a persisted **Relational Database**.
-   **Recommendation:** **PostgreSQL**. It is robust, scalable, and natively supported by Railway.
-   **Role:** Stores "Patients", "Appointments", "BlogPosts", "Users" (Admin).
-   **Tooling:** Use **Prisma ORM**. It allows you to define your database structure (Schema) in a simple file and auto-generates the TypeScript code to interact with it.

### B. How Data is Transmitted (The "API")

**Current:**
-   Data is "imported" directly from local files. Zero transmission time.

**What Needs to be Done:**
You need an **API Layer** (Backend) to sit between your Website (Frontend) and your Database.
1.  **Client (Frontend):** Uses `fetch()` or `axios` to send requests.
    *   *Example:* User clicks "Save Post". Frontend sends `POST /api/posts` with `{ title: "...", content: "..." }`.
2.  **Transmission:** serialized **JSON** data sent over **HTTPS**.
3.  **Server (Backend):** Receives the request.
    *   Validates the data (e.g., "Is the title empty?").
    *   Checks Security (e.g., "Is the user logged in?").
    *   Talks to the Database (via Prisma).
4.  **Database:** Save the record and returns the new ID.
5.  **Response:** Server sends `201 OK` back to Frontend.

### C. Implementation Roadmap

To turn this into a fully functional system:

1.  **Create a Backend Project:**
    *   You can create a separate folder (e.g., `server/`) or a separate repo.
    *   Tech Stack: Node.js with **Express** or **Fastify**.
2.  **Setup Database:**
    *   Provision a PostgreSQL database on Railway.
    *   Connect Prisma to this database.
3.  **Build API Endpoints:**
    *   `GET /posts` (Fetch all posts)
    *   `POST /login` (Real authentication)
    *   `POST /appointments` (Save new appointment)
4.  **Connect Frontend:**
    *   Replace `import { blogPosts } from '@/data/posts'` with `fetch('https://api.yoursite.com/posts')`.

---

## 3. Deployment Guide: Railway

Since you currently have a Frontend-only application, we will deploy it as a **Static Site**.

### Option A: Automatic Deployment (Simplest)

1.  **Push Code to GitHub:** Ensure your latest code is pushed to your repository.
2.  **Create Project on Railway:**
    *   Go to [Railway.app](https://railway.app/).
    *   Click **"New Project"** -> **"Deploy from GitHub repo"**.
    *   Select your repository.
3.  **Configure Settings:**
    *   Railway usually detects Vite automatically.
    *   If asked, confirm the following:
        *   **Build Command:** `npm run build`
        *   **Output Directory:** `dist`
4.  **Deploy:** Click Deploy. Railway will build your site and provide a URL (e.g., `bright-smiles.up.railway.app`).

### Option B: Robust Production Server (Recommended)

For better performance and avoiding "404 Not Found" errors on refresh (common in SPAs), use a **Dockerfile**.

**1. Create a file named `Dockerfile` in your root folder:**

```dockerfile
# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with a lightweight server (Caddy or Nginx)
# using 'serve' is easiest for Node environments
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

# Expose port 3000 (Railway default)
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**2. Push to GitHub.**
Railway will detect the Dockerfile and use it automatically.

### Option C: Future (Full Stack Deployment)

When you are ready to add the backend:

1.  **Add Database Service:** In your Railway project, click "New" -> "Database" -> "PostgreSQL".
2.  **Add Backend Service:** Deploy your Node.js backend repo.
3.  **Link Environmental Variables:**
    *   In your Backend Service settings, add `DATABASE_URL` (from the Postgres service).
    *   In your Frontend Service settings, add `VITE_API_URL` (the URL of your Backend Service).

---

## Summary of Immediate Actions

1.  **To go live NOW:** Use **Option A** or **Option B** above to deploy the current static version.
2.  **To make functionality work:** You must start the **"Implementation Roadmap"** (Step 2C) to build the backend and database.
