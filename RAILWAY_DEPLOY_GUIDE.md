# Railway Deployment Guide (Full Stack)

Your application is now a "Monorepo" containing two services (Frontend and Backend) plus a Database. Here is exactly how to deploy it on Railway.

## 1. Push to GitHub
Make sure all your latest changes (including the new `server` folder, `docker-compose.yml`, and updated `package.json` files) are committed and pushed to your GitHub repository.

## 2. Create the Project on Railway
1.  Go to **Railway.app**.
2.  Click **"New Project"**.
3.  Choose **"Provision PostgreSQL"**.
    *   This creates your **Database** first.
    *   After a moment, it will be active.

## 3. Deploy the Backend (API)
1.  In your Railway project view, hit `Cmd + K` (or click "New") and select **"GitHub Repo"**.
2.  Select your `bright-smiles-website` repository.
3.  **IMPORTANT: Configure Settings BEFORE Deploy:**
    *   Click on the newly created service card.
    *   Go to **Settings** -> **General** -> **Root Directory**.
    *   Set it to: `/server` (This tells Railway this service is just the backend).
4.  **Variables:**
    *   Go to the **Variables** tab.
    *   Add `DATABASE_URL`.
    *   For the value, **do not paste it manually**. Type `$` and select the PostgreSQL variable reference (e.g., `${PostgreSQL.DATABASE_URL}`). This links them securely.
    *   Add `PORT` = `3001`.
5.  **Deploy:** The service should restart. Check the **Deployments** logs. You should see "Applying migration..." and then "Server running on port 3001".
6.  **Public URL:**
    *   Go to **Settings** -> **Networking**.
    *   Click **"Generate Domain"**.
    *   Copy this URL (e.g., `https://backend-production.up.railway.app`). **You will need it for the frontend.**

## 4. Deploy the Frontend (Website)
1.  Add **Another Service** from the same GitHub Repo. (Yes, you add the repo a second time).
2.  **Configure Settings:**
    *   **Root Directory:** Leave it empty (or `/`) since your frontend is at the root.
    *   Railway will detect your root `Dockerfile`.
3.  **Variables:**
    *   Go to **Variables**.
    *   Add `VITE_API_URL`.
    *   Value: The **Public URL** of your Backend (from Step 3.6), WITHOUT the trailing slash.
        *   Example: `https://backend-production.up.railway.app`
4.  **Deploy:**
    *   Railway will build your frontend.
    *   **Crucial:** Since the Dockerfile builds the static files, it *needs* the `VITE_API_URL` during the "Build" phase. Railway manages this automatically if the variable is set.
5.  **Public URL:**
    *   Generate a domain for this frontend service.
    *   This is your real website URL (e.g. `https://bright-smiles.up.railway.app`).

## 5. Seed the Database (Optional)
Your database is fresh and empty. To create the initial Admin user:
1.  Click on your **Backend Service** in Railway.
2.  Go to the **"Shell"** (Railway CLI) tab if available, OR install the Railway CLI locally.
3.  **Easier Option:** Connect locally to the remote DB.
    *   Copy the `DATABASE_URL` from Railway.
    *   In your local terminal: `DATABASE_URL="postgresql://..." node server/prisma/seed.js`
4.  **Easiest Option (One-off Command):**
    *   In Railway Backend Service -> Settings -> Build Command.
    *   Change it temporarily to `npm install && npx prisma db seed`.
    *   Deploy once, then remove it.

## Summary of Services
You should have 3 boxes in your Railway Project Canvas:
1.  **PostgreSQL** (The Database)
2.  **Backend** (Root Dir: `/server`, has `DATABASE_URL`, exposes a URL)
3.  **Frontend** (Root Dir: `/`, has `VITE_API_URL`, exposes a URL)
