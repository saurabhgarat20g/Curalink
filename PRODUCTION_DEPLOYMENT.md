# 🌐 Curalink Production Deployment Guide

This guide provides step-by-step instructions for deploying the **Curalink AI Medical Research Assistant** to production using Vercel, Render, and MongoDB Atlas.

---

## 1. 🗄️ Database Setup (MongoDB Atlas)

1.  Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new **Shared Cluster** (Free Tier).
3.  Go to **Database Access** and create a user with `Read and Write to any database` permissions.
4.  Go to **Network Access** and select `Allow Access from Anywhere` (0.0.0.0/0).
5.  Click **Connect** > **Drivers** and copy your **Connection String**.
    *   *Example:* `mongodb+srv://<user>:<password>@cluster0.mongodb.net/curalink_medical`

---

## 2. 🟢 Backend Deployment (Render or Railway)

### Using Render:
1.  Connect your GitHub repository to [Render](https://render.com/).
2.  Select **New > Web Service**.
3.  Choose the `server` root directory.
4.  **Runtime**: `Node`.
5.  **Build Command**: `npm install`
6.  **Start Command**: `node index.js`
7.  **Environment Variables**:
    *   `MONGODB_URI`: (Your Atlas string)
    *   `PORT`: `5000` (or leave as default)
    *   `OLLAMA_BASE_URL`: (Endpoint for your hosted LLM)
    *   `ALLOWED_ORIGINS`: `https://your-app.vercel.app`

---

## 3. 🔵 Frontend Deployment (Vercel)

### Using Vercel:
1.  Connect your GitHub repository to [Vercel](https://vercel.com/).
2.  Select the `client` folder as the root.
3.  **Framework Preset**: `Vite`.
4.  **Build Command**: `npm run build`
5.  **Output Directory**: `dist`
6.  **Environment Variables**:
    *   `VITE_API_BASE_URL`: `https://your-backend.render.com/api`

---

## 🤖 LLM Strategy in Production

Since Ollama is a local service, you have three options for production:

1.  **Template Fallback (Default)**: The app will automatically use its internal medical template engine if no LLM is detected.
2.  **Self-Hosted LLM**: Run Ollama on a GPU-enabled VPS and point `OLLAMA_BASE_URL` to its public IP.
3.  **External API**: Modify `llmService.js` to use an OpenAI-compatible endpoint (like Groq or HuggingFace).

---

## 🔐 Required Variable List

| Variable | Description | Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://...` |
| `VITE_API_BASE_URL` | Frontend pointer to backend | `https://api.curalink.com/api` |
| `ALLOWED_ORIGINS` | Backend whitelist for CORS | `https://curalink.vercel.app` |
| `PUBMED_API_KEY` | PubMed E-utilities key | `abc123...` |

---

## 🧪 Testing Your Deployment

1.  **Health Check**: Visit `https://your-backend.render.com/health`.
2.  **API Connectivity**: Search for a condition and check the Browser's **Network Tab** to ensure requests go to the Render URL, not localhost.
3.  **Cross-Origin**: Verify that the browser doesn't block requests with a CORS error.
