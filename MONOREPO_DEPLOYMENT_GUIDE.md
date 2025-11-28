# 📦 MONOREPO DEPLOYMENT GUIDE
## How to Deploy Frontend & Backend Separately from Your Single Folder

---

## 🏗️ Your Current Structure

```
/home/runner/workspace/  (ROOT - MONOREPO)
│
├── /server/              ← BACKEND (Node.js/Express)
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
│
├── /client/              ← FRONTEND (React/Vite)
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.tsx
│   └── index.html
│
├── /shared/              ← SHARED CODE
│   └── schema.ts
│
├── package.json          ← ROOT (has all dependencies)
├── vite.config.ts        ← Handles both frontend & backend
├── tsconfig.json
└── tailwind.config.ts
```

**What is a Monorepo?**
- Single Git repository
- Both frontend and backend code
- Shared dependencies in one `package.json`
- Single Vite config that serves both

**Why separate them for deployment?**
- Render needs only the backend code
- Vercel needs only the frontend code
- They deploy independently
- Different build/start processes

---

## 🚀 HOW DEPLOYMENT WORKS (No Code Changes!)

### Key Insight: You Don't Need to Separate Files!

Instead:

| Service | What It Sees | What It Runs | Result |
|---------|------------|------------|--------|
| **Render** | Entire repo | Only `/server` folder | Backend API |
| **Vercel** | Entire repo | Only `/client` folder + build to `/dist` | Frontend SPA |

Both services will download your entire monorepo, then use **build commands** to extract what they need.

---

## 📋 STEP-BY-STEP DEPLOYMENT GUIDE

# PART 1: PREPARE FOR RENDER (Backend)

## Step 1: Make Sure GitHub Has Your Code

```bash
# In terminal:
git add .
git commit -m "Ready for deployment"
git push origin main
```

✅ Your entire monorepo should be on GitHub now

---

## Step 2: Go to Render Dashboard

```
1. Open: https://render.com
2. Sign in with GitHub
3. Click "Create New +" button
4. Select "Web Service"
```

---

## Step 3: Connect Your GitHub Repository

```
1. Search for your repository (e.g., "classroom-management")
2. Click "Connect"
3. Authorize Render to access your GitHub
```

✅ Render can now see all your code (frontend + backend + shared)

---

## Step 4: Configure Render to Run ONLY Backend

Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `classroom-api` (or any name) |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node --loader tsx server/index.ts` |
| **Root Directory** | `.` (leave blank, means root) |

```
Build Command:  npm install
Start Command:  node --loader tsx server/index.ts
```

**Why this works:**
- `npm install` → Installs all dependencies from `package.json`
- `node --loader tsx server/index.ts` → Runs ONLY the backend server
- Frontend code in `/client` is ignored
- Render doesn't need to build frontend

---

## Step 5: Add Environment Variables

Click "Add Environment Variable" and add:

```
DATABASE_URL=postgresql://user:pass@host/db
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SESSION_SECRET=your_secret_key
NODE_ENV=production
```

✅ Keep these secret - don't commit to GitHub

---

## Step 6: Deploy Backend

```
1. Click "Create Web Service" button
2. Wait for deployment (5-10 minutes)
3. You'll get a URL like:
   https://classroom-api.onrender.com
```

✅ Your backend is now running on Render!

---

## Step 7: Test Backend Deployment

Open in browser:
```
https://classroom-api.onrender.com/api/auth/me
```

You should see:
```json
{"message": "Authentication required"}
```

(This is good! It means the API is working)

---

# PART 2: PREPARE FOR VERCEL (Frontend)

## Step 1: Go to Vercel Dashboard

```
1. Open: https://vercel.com
2. Sign in with GitHub
3. Click "Add New"
4. Select "Project"
```

---

## Step 2: Import Your GitHub Repository

```
1. Search for your repository (e.g., "classroom-management")
2. Click "Import"
3. Authorize Vercel to access your GitHub
```

✅ Vercel can now see all your code

---

## Step 3: Configure Vercel to Build ONLY Frontend

In the "Configure Project" screen:

| Field | Value |
|-------|-------|
| **Project Name** | `classroom-frontend` |
| **Framework** | `Vite` |
| **Root Directory** | `./client` (IMPORTANT!) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

```
Root Directory: ./client
Build Command: npm run build
Output Directory: dist
```

**Why this works:**
- `Root Directory: ./client` → Tells Vercel to look in the client folder
- `npm run build` → Builds frontend to `/dist`
- Backend code is ignored
- Vercel only builds the React/Vite app

---

## Step 4: Add Environment Variables

Click "Add Environment Variable" and add:

```
VITE_API_URL=https://classroom-api.onrender.com
```

(Use the URL from your Render backend deployment)

✅ Frontend now knows where the backend is

---

## Step 5: Deploy Frontend

```
1. Click "Deploy" button
2. Wait for deployment (2-5 minutes)
3. You'll get a URL like:
   https://classroom-frontend.vercel.app
```

✅ Your frontend is now running on Vercel!

---

## Step 6: Test Frontend Deployment

Open in browser:
```
https://classroom-frontend.vercel.app
```

You should see your login page!

Try logging in:
- It will call `https://classroom-api.onrender.com` (your Render backend)
- If login works, everything is connected! ✅

---

# ✅ COMPLETE DEPLOYMENT CHECKLIST

## Before Deployment
- [ ] All code pushed to GitHub
- [ ] Monorepo folder structure is correct
- [ ] Both `/server` and `/client` folders exist
- [ ] `package.json` in root has all dependencies
- [ ] Test locally: `npm run dev` works

## Render Deployment (Backend)
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Set Root Directory to `.` (or leave blank)
- [ ] Build Command: `npm install`
- [ ] Start Command: `node --loader tsx server/index.ts`
- [ ] Add environment variables (DATABASE_URL, CLOUDINARY_*, SESSION_SECRET)
- [ ] Deploy and get backend URL
- [ ] Test: Open backend URL in browser, see API response
- [ ] Copy backend URL

## Vercel Deployment (Frontend)
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Set Root Directory to `./client`
- [ ] Framework: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Add environment variable: `VITE_API_URL=<backend_url>`
- [ ] Deploy and get frontend URL
- [ ] Test: Open frontend URL in browser
- [ ] Try logging in to verify connection to backend

## After Deployment
- [ ] Test user login
- [ ] Create a group
- [ ] Create a task
- [ ] Submit a task
- [ ] Grade a submission
- [ ] Check file uploads work
- [ ] Monitor error logs for 24 hours

---

# 🔧 IMPORTANT CONFIGURATION FILES (Don't Touch)

These files already exist and work for monorepo:

### ✅ `package.json` (Root)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "start": "node --loader tsx server/index.ts"
  }
}
```
- Render runs: `npm install` (installs everything)
- Then runs: `node --loader tsx server/index.ts` (starts backend only)

### ✅ `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  // Already configured for both frontend & backend
})
```
- Handles both `/client` frontend build
- Ignores `/server` backend when running build command

### ✅ `/client/index.html`
- Vercel finds this and knows it's a Vite app
- Uses `VITE_API_URL` to connect to backend

---

# 📊 DATA FLOW AFTER DEPLOYMENT

```
User Browser
    │
    ├──→ https://classroom-frontend.vercel.app (Vercel)
    │    • React app loads
    │    • JavaScript runs in browser
    │
    │    When user logs in:
    │    ├──→ https://classroom-api.onrender.com/api/auth/login (Render)
    │         • Express backend receives request
    │         • Queries PostgreSQL database
    │         • Uploads files to Cloudinary
    │         • Returns response
    │    │
    │    └──→ Vercel frontend receives response
    │         • Shows success/error message
    │         • Stores auth token
    │
    └──  All subsequent requests follow same pattern
```

---

# 🚨 TROUBLESHOOTING

### Problem: "Cannot find module" on Render

**Solution:**
- Make sure `/server` folder exists
- Make sure `package.json` has all dependencies
- Check logs: `node --loader tsx server/index.ts`

### Problem: Frontend shows "Cannot connect to API"

**Solution:**
- Check `VITE_API_URL` environment variable in Vercel
- Should be: `https://classroom-api.onrender.com` (your Render URL)
- Test API directly: Open `https://classroom-api.onrender.com/api/auth/me` in browser
- Check CORS settings in backend

### Problem: File uploads not working

**Solution:**
- Check Cloudinary credentials in Render environment variables
- Test: Upload file on frontend → should appear on Cloudinary
- Check browser console for errors

### Problem: Login not working

**Solution:**
- Test backend API directly: 
  ```
  curl -X POST https://classroom-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}'
  ```
- Check database connection (DATABASE_URL)
- Check logs in Render dashboard

### Problem: Vercel build fails

**Solution:**
- Check Root Directory is set to `./client`
- Check Build Command is `npm run build`
- Check environment variable `VITE_API_URL` is set
- Check logs in Vercel dashboard

---

# 📱 AFTER DEPLOYMENT - DAILY USE

### To Update Code:

```bash
# Make changes locally
git add .
git commit -m "Your message"
git push origin main
```

**What happens automatically:**
1. Render sees the push → Automatically rebuilds backend
2. Vercel sees the push → Automatically rebuilds frontend
3. Both redeploy without your action (auto-deploy enabled)

### To Monitor:

**Render Dashboard:**
- Click your service
- Click "Logs" tab
- See backend errors in real-time

**Vercel Dashboard:**
- Click your project
- Click "Deployments" tab
- See build logs and errors

---

# 💾 KEEPING LOCAL REPLIT VERSION

You can keep your Replit version as backup:

1. Don't delete anything on Replit
2. Run `npm run dev` locally to test
3. When everything works, push to GitHub
4. Deploy to Render + Vercel
5. Keep Replit running as fallback

**URL Structure After Deployment:**
```
Local Dev:        http://localhost:5000
Render Backend:   https://classroom-api.onrender.com
Vercel Frontend:  https://classroom-frontend.vercel.app
Replit Backup:    https://classroom-management-xxxx.replit.dev
```

---

# 🎯 KEY POINTS - REMEMBER!

1. **No Code Changes Needed**
   - Your monorepo structure is perfect as-is
   - Just point each service to the right folder

2. **Monorepo Magic**
   ```
   Render:  Takes entire repo → runs `/server` only
   Vercel:  Takes entire repo → builds `/client` only
   ```

3. **Build Commands Matter**
   ```
   Render Build:  npm install
   Render Start:  node --loader tsx server/index.ts
   
   Vercel Build:  npm run build
   Vercel Root:   ./client
   ```

4. **Environment Variables Are Key**
   ```
   Render needs:  DATABASE_URL, CLOUDINARY_*, SESSION_SECRET
   Vercel needs:  VITE_API_URL (points to Render backend)
   ```

5. **GitHub is Your Pipeline**
   ```
   git push → Render auto-deploys backend
   git push → Vercel auto-deploys frontend
   No manual deployments needed!
   ```

---

# 📚 QUICK REFERENCE

## Render Configuration
```
Build Command: npm install
Start Command: node --loader tsx server/index.ts
Root Directory: . (leave blank)
Environment: Node
```

## Vercel Configuration
```
Root Directory: ./client
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

## Environment Variables

### Render (Backend)
```
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SESSION_SECRET=...
NODE_ENV=production
```

### Vercel (Frontend)
```
VITE_API_URL=https://classroom-api.onrender.com
```

---

# ✨ YOU'RE READY!

Your monorepo is perfect for deployment. Just follow the steps above:

1. Push to GitHub ✅
2. Deploy to Render (backend) ✅
3. Deploy to Vercel (frontend) ✅
4. Add environment variables ✅
5. Test! ✅

**No code changes needed. Your structure is already optimized for this!**

Questions? Check the troubleshooting section above.
