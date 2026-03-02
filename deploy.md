# ================================================================
# BOLLYFLIX LINK EXTRACTOR — DEPLOYMENT PROMPT
# Cloudflare Pages (Frontend) + HuggingFace Spaces Docker (Backend)
# Works on BOTH localhost AND production simultaneously
# ================================================================

## GOAL

The BollyFlix Link Extractor has two parts:
- **Frontend** (React + Vite) → Deploy to Cloudflare Pages (free)
- **Backend** (Node.js + Express + Playwright) → Deploy to HuggingFace Spaces using Docker (free)

Both localhost AND production must work at the same time.
The frontend auto-detects whether it is running locally or on Cloudflare
and connects to the correct backend URL automatically.

---

## COMPLETE FOLDER STRUCTURE AFTER ADDING DEPLOYMENT FILES

```
bollyflix-extractor/
├── package.json                        ← root
├── .gitignore                          ← NEW
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.development                ← NEW (localhost backend URL)
│   ├── .env.production                 ← NEW (HuggingFace backend URL)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                     ← MODIFIED (use env variable for backend URL)
│       ├── index.css
│       └── components/
│           ├── Header.jsx
│           ├── UrlInput.jsx
│           ├── FilterWords.jsx
│           ├── ProgressBar.jsx
│           ├── StatsRow.jsx
│           ├── ResultCard.jsx
│           └── LinksBox.jsx
│
└── backend/
    ├── package.json
    ├── server.js
    ├── automator.js
    ├── .env                            ← backend env
    ├── Dockerfile                      ← NEW (production Docker for HuggingFace)
    └── .dockerignore                   ← NEW
```

---

## FILES TO CREATE

---

### 1. .gitignore (root level)

Create this file at the ROOT of the project:

```
node_modules/
frontend/node_modules/
backend/node_modules/
frontend/dist/
.env
.env.local
.env.production
*.log
.DS_Store
```

---

### 2. frontend/.env.development

This file is used automatically by Vite when running `npm run dev` (localhost).

```
VITE_BACKEND_URL=http://localhost:5000
```

---

### 3. frontend/.env.production

This file is used automatically by Vite when running `npm run build` (Cloudflare Pages).
Replace `YOUR-SPACE-NAME` and `YOUR-HF-USERNAME` with your actual HuggingFace Space details.

```
VITE_BACKEND_URL=https://YOUR-HF-USERNAME-YOUR-SPACE-NAME.hf.space
```

Example:
```
VITE_BACKEND_URL=https://john-bollyflix-backend.hf.space
```

---

### 4. Modify frontend/src/App.jsx — Use env variable for backend URL

Find this line at the top of App.jsx:
```javascript
const BACKEND = 'http://localhost:5000'
```

Replace it with:
```javascript
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
```

This means:
- On localhost → uses `http://localhost:5000` (from .env.development)
- On Cloudflare → uses your HuggingFace URL (from .env.production)
- If neither env file exists → falls back to localhost

---

### 5. backend/Dockerfile

This is the Docker file that HuggingFace Spaces uses to run the backend.

```dockerfile
# Use the official Playwright image which has all browser dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# HuggingFace Spaces runs as user 1000, not root
# We need to set up permissions correctly
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Copy all backend source files
COPY . .

# Give ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user (required by HuggingFace)
USER appuser

# HuggingFace Spaces uses port 7860 by default
# Our app will listen on this port in production
EXPOSE 7860

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=7860

# Start the backend server
CMD ["node", "server.js"]
```

---

### 6. backend/.dockerignore

Prevents unnecessary files from being copied into Docker image (makes image smaller and faster):

```
node_modules/
.env
*.log
.DS_Store
README.md
```

---

### 7. backend/.env — Update for both environments

```
# Local development port
PORT=5000

# In production (HuggingFace), PORT is set to 7860 via Dockerfile ENV
# So this file is only used locally
```

---

### 8. backend/server.js — Add CORS fix for production

Find the CORS line in server.js:
```javascript
app.use(cors({ origin: '*' }))
```

Replace with this (allows both localhost AND Cloudflare):
```javascript
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      // Add your Cloudflare Pages URL here after deployment
      // Example: 'https://bollyflix-extractor.pages.dev'
      /\.pages\.dev$/,     // Allow ALL Cloudflare Pages subdomains
      /\.cloudflare\.com$/ // Allow Cloudflare domains
    ];
    
    const allowed = allowedOrigins.some(o => 
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    
    callback(null, allowed || process.env.NODE_ENV !== 'production');
  },
  credentials: true
}));
```

---

## HOW TO DEPLOY — STEP BY STEP

---

### PART A: Deploy Backend to HuggingFace Spaces

**Step 1:** Go to https://huggingface.co and create a free account.

**Step 2:** Click "New Space" → Fill in:
- Space name: `bollyflix-backend` (or any name you want)
- SDK: Select **"Docker"**
- Visibility: **Public** (required for free tier)
- Click "Create Space"

**Step 3:** In your backend folder, initialize git and push to HuggingFace:

```bash
cd backend

# Initialize git
git init
git add .
git commit -m "Initial backend deployment"

# Add HuggingFace remote (replace with your username and space name)
git remote add space https://huggingface.co/spaces/YOUR-USERNAME/bollyflix-backend

# Push to HuggingFace
git push space main
```

**Step 4:** HuggingFace will automatically:
1. Detect the Dockerfile
2. Build the Docker image
3. Install Playwright and Chromium
4. Start your Express server on port 7860

**Step 5:** Wait 3-5 minutes for the build to complete. Your backend URL will be:
```
https://YOUR-USERNAME-bollyflix-backend.hf.space
```

**Step 6:** Test it by visiting:
```
https://YOUR-USERNAME-bollyflix-backend.hf.space/api/health
```
You should see: `{"status":"ok"}`

**Step 7:** Copy this URL and put it in `frontend/.env.production`:
```
VITE_BACKEND_URL=https://YOUR-USERNAME-bollyflix-backend.hf.space
```

---

### PART B: Deploy Frontend to Cloudflare Pages

**Step 1:** Go to https://cloudflare.com and create a free account.

**Step 2:** Push your entire project to GitHub:
```bash
# In the ROOT of the project (bollyflix-extractor/)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/bollyflix-extractor.git
git push origin main
```

**Step 3:** In Cloudflare Dashboard:
- Go to **"Workers & Pages"** → **"Create Application"** → **"Pages"**
- Click **"Connect to Git"**
- Select your GitHub repository
- Click **"Begin Setup"**

**Step 4:** Configure build settings in Cloudflare:

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Build command | `cd frontend && npm install && npm run build` |
| Build output directory | `frontend/dist` |
| Root directory | `/` (leave as default) |

**Step 5:** Add Environment Variables in Cloudflare:
- Click **"Environment variables"**
- Add variable:
  - Name: `VITE_BACKEND_URL`
  - Value: `https://YOUR-USERNAME-bollyflix-backend.hf.space`

**Step 6:** Click **"Save and Deploy"**

**Step 7:** Wait 2-3 minutes. Your frontend URL will be:
```
https://bollyflix-extractor.pages.dev
```

---

### PART C: Update CORS in backend after getting Cloudflare URL

After you get your Cloudflare URL (e.g., `https://bollyflix-extractor.pages.dev`),
add it to the allowedOrigins array in `backend/server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'https://bollyflix-extractor.pages.dev',  // ← Add your actual Cloudflare URL
  /\.pages\.dev$/,
  /\.cloudflare\.com$/
];
```

Then push this change to HuggingFace:
```bash
cd backend
git add .
git commit -m "Fix CORS for Cloudflare"
git push space main
```

---

## HOW LOCALHOST STILL WORKS

When you run `npm run dev` locally:
1. Vite reads `.env.development` → `VITE_BACKEND_URL=http://localhost:5000`
2. Frontend connects to `http://localhost:5000`
3. Backend runs on port 5000 via `nodemon server.js`
4. Everything works exactly as before

When deployed on Cloudflare:
1. Vite used `.env.production` during build → `VITE_BACKEND_URL=https://YOUR-HF-SPACE.hf.space`
2. Frontend connects to HuggingFace backend
3. Backend runs on port 7860 in Docker container
4. Everything works in production

**Both environments work independently — no code changes needed when switching.**

---

## IMPORTANT NOTES FOR HUGGINGFACE

1. **Free tier sleeping:** HuggingFace free Spaces go to sleep after 48 hours of inactivity.
   When a user opens the tool after sleep, first request takes 30-60 seconds to wake up.
   After that it runs normally. To avoid this, upgrade to paid tier or use a uptime monitor.

2. **Port must be 7860:** HuggingFace Docker Spaces ALWAYS use port 7860 externally.
   The Dockerfile already sets `ENV PORT=7860` so server.js picks it up via `process.env.PORT`.

3. **No `.env` file on HuggingFace:** Never push your `.env` file to HuggingFace.
   Set environment variables in HuggingFace Space Settings → "Variables and secrets" tab instead.

4. **Playwright in Docker:** The Dockerfile uses `mcr.microsoft.com/playwright:v1.40.0-jammy`
   which already has all Linux dependencies for Chromium. Do NOT use a plain Node.js image
   because Playwright needs many system libraries that are pre-installed in this image.

5. **Build time:** First Docker build on HuggingFace takes 5-10 minutes because it downloads
   Chromium. Subsequent deploys are faster due to Docker layer caching.

---

## QUICK REFERENCE — ALL COMMANDS

```bash
# ── LOCAL DEVELOPMENT ──────────────────────────────
npm run install:all          # Install all dependencies
cd backend && npx playwright install chromium  # Install browser
npm run dev                  # Start both frontend + backend

# ── DEPLOY BACKEND TO HUGGINGFACE ──────────────────
cd backend
git init
git add .
git commit -m "deploy"
git remote add space https://huggingface.co/spaces/USERNAME/SPACE-NAME
git push space main

# ── UPDATE BACKEND ON HUGGINGFACE ──────────────────
cd backend
git add .
git commit -m "update"
git push space main

# ── DEPLOY FRONTEND TO CLOUDFLARE ──────────────────
# Done automatically via GitHub → Cloudflare Pages CI/CD
# Just push to GitHub and Cloudflare rebuilds automatically:
git add .
git commit -m "update frontend"
git push origin main
```

---

## TESTING CHECKLIST

After deployment, verify these:

- [ ] `https://YOUR-HF-SPACE.hf.space/api/health` → returns `{"status":"ok"}`
- [ ] `https://YOUR-CLOUDFLARE-APP.pages.dev` → frontend loads correctly
- [ ] Paste `https://bollyflix.sarl/movies/page/22/` → extraction works
- [ ] Links appear as `https://video-downloads.googleusercontent.com/...` (NOT wrapped)
- [ ] `http://localhost:3000` still works locally with `npm run dev`