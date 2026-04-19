# 🚀 Curalink Deployment Guide

1. Verify the `/api/health` or `/api/status` endpoint.
2. Ensure you have a valid `PUBMED_API_KEY` for high-volume retrieval.
3. Test the Ollama connection to ensure the AI Analysis tab populates correctly.

---

## 🛠 Prerequisites
- **Docker & Docker Compose** (Recommended)
- **Node.js 20+** (For manual setup)
- **MongoDB** (Local or Atlas)
- **Ollama** (Running locally on port 11434)

---

## 🐳 Option 1: Docker (Recommended)
This is the easiest way to run the entire stack (Frontend, Backend, MongoDB, and Ollama) in one command.

### 1. Build and Start
Run the following command in the root directory:
```bash
docker-compose up --build -d
```

### 2. Pull the LLM Model
Once the containers are running, you need to pull the medical-compatible model inside the Ollama container:
```bash
docker exec -it caurapro-ollama-1 ollama pull mistral
```

### 3. Access the App
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000

---

## ☁️ Option 2: Cloud Deployment (Vercel / Heroku / Render)

### 1. Backend (Server)
Deploy the `/server` folder to a service like **Render**, **Railway**, or **Heroku**.
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Environment Variables**:
  - `MONGODB_URI`: Your MongoDB connection string (e.g., MongoDB Atlas).
  - `OLLAMA_BASE_URL`: The URL of your remote Ollama instance (or a hosted alternative).
  - `OLLAMA_MODEL`: `mistral` (or your preferred model).

### 2. Frontend (Client)
Deploy the `/client` folder to **Vercel** or **Netlify**.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Proxy/API Config**: Ensure the frontend points to your production backend URL (configured in `vite.config.js`).

---

## 🔒 Security & Privacy
Because this tool handles medical research data:
1. **SSL/TLS**: Always use HTTPS in production.
2. **Rate Limiting**: The backend already includes rate limiting, but consider a provider-level WAF (like Cloudflare).
3. **Database Encryption**: Ensure MongoDB "Encryption at Rest" is enabled if using MongoDB Atlas.

---

## 🚀 Post-Deployment Check
1. Verify the `/api/health` or `/api/status` endpoint.
2. Ensure you have a valid `PUBMED_API_KEY` for high-volume retrieval.
3. Test the Ollama connection to ensure the AI Analysis tab populates correctly.
