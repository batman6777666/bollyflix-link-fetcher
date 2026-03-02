# ================================================================
# PRODUCTION CONFIG FIX — Connect Frontend to Backend
# Frontend: https://bollyflix-link-fetcher.pages.dev
# Backend:  https://bollyflixfetcher-bollyflix.hf.space
# ================================================================

## MAKE THESE EXACT CHANGES IN YOUR CODE:

---

### CHANGE 1 — frontend/.env.production

Open file: `frontend/.env.production`
Replace entire content with:

```
VITE_BACKEND_URL=https://bollyflixfetcher-bollyflix.hf.space
```

---

### CHANGE 2 — frontend/.env.development

Open file: `frontend/.env.development`
Replace entire content with:

```
VITE_BACKEND_URL=http://localhost:5000
```

---

### CHANGE 3 — frontend/src/App.jsx

Find this line at the top of App.jsx:
```javascript
const BACKEND = 'http://localhost:5000'
```

Replace with:
```javascript
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
```

---

### CHANGE 4 — backend/server.js

Find the CORS line. It currently looks like either:
```javascript
app.use(cors({ origin: '*' }))
```
OR
```javascript
app.use(cors())
```

Replace it with:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'https://bollyflix-link-fetcher.pages.dev'
  ],
  methods: ['GET', 'POST'],
  credentials: false
}))
```

---

## AFTER MAKING ALL CHANGES — RUN THESE COMMANDS:

### Push backend to HuggingFace:
```bash
cd backend
git add .
git commit -m "fix: add cors for production frontend URL"
git push space main
```

### Push frontend to GitHub (Cloudflare auto-rebuilds):
```bash
cd ..
git add .
git commit -m "fix: add production backend URL env variable"
git push origin main
```

---

## VERIFY EVERYTHING WORKS:

**Step 1:** Wait 3-5 minutes for HuggingFace to rebuild backend.

**Step 2:** Test backend is alive:
```
https://bollyflixfetcher-bollyflix.hf.space/api/health
```
Expected response: `{"status":"ok"}`

**Step 3:** Open frontend:
```
https://bollyflix-link-fetcher.pages.dev
```

**Step 4:** Paste this URL and click Start Extraction:
```
https://bollyflix.sarl/movies/page/22/
```

**Step 5:** Verify extracted links look like:
```
https://video-downloads.googleusercontent.com/ADGPM2...
```
NOT wrapped in `fastcdn-dl.pages.dev`

---

## HOW IT WORKS

- When you run `npm run dev` locally → Vite reads `.env.development` → connects to `http://localhost:5000`
- When deployed on Cloudflare → Vite reads `.env.production` → connects to `https://bollyflixfetcher-bollyflix.hf.space`
- No code changes needed when switching between local and production