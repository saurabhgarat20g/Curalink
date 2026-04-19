# 🏁 Curalink Final Deployment Tasks

Follow these steps once you have your URLs from Render and Vercel.

---

### 1️⃣ Task: Connect Frontend to Backend
**Location**: [Vercel Dashboard](https://vercel.com/)
1. Go to your project **Settings > Environment Variables**.
2. Add/Update `VITE_API_BASE_URL`.
3. **Value**: `https://curalink-lquh.onrender.com/api`
4. **Redeploy** the project to apply changes.

---

### 2️⃣ Task: The "Loopback" (Security)
**Location**: [Render Dashboard](https://dashboard.render.com/)
1. Go to your Web Service **Settings > Environment Variables**.
2. Update `ALLOWED_ORIGINS`.
3. **Value**: Your Vercel URL (e.g., `https://curalink-frontend.vercel.app`)
4. This allows your frontend to securely request data from your API.

---

### 3️⃣ Task: Database Whitelist
**Location**: [MongoDB Atlas](https://cloud.mongodb.com/)
1. Go to **Network Access**.
2. Ensure `0.0.0.0/0` is added to the IP Access List.
3. This ensures Render can talk to your database.

---

### 🚀 Verification
1. Open your Vercel URL in a browser.
2. Search for any condition (e.g., "Lung Cancer").
3. If search results appear, your entire MERN stack is successfully linked!
