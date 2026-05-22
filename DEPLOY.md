# Deployment

## shm-api → Render

[render.yaml](shm-api/render.yaml) declares the service, but Render won't pick it up automatically unless the repo root contains it or you create a Blueprint. The simplest path:

1. Push this monorepo to a public/private GitHub repo.
2. **Render → New → Web Service → Connect your repo**.
3. Set **Root Directory** = `web/shm-api`, **Runtime** = Node, **Build Command** = `npm install`, **Start Command** = `npm start`.
4. **Environment**: add the same four secrets from `web/shm-api/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TTN_WEBHOOK_SECRET`
   - `CORS_ORIGIN` — set to your eventual Vercel URL, e.g. `https://shm-dashboard.vercel.app`
   - `PORT` — leave unset; Render injects it.
5. **Health check path**: `/api/health`.
6. **Deploy**. The first cold start takes ~30 s.

### Keep Render's free dyno awake

Free Render web services sleep after 15 min of no traffic. To keep `/api/ingest/ttn` warm so TTN uplinks aren't lost during cold-start:

1. Sign up at **https://uptimerobot.com** (free tier: 50 monitors, 5-min intervals).
2. **+ Add New Monitor** → Type **HTTP(s)** → URL `https://<your-render-app>.onrender.com/api/health` → Interval **5 minutes** → Create.

The dyno sleep window is 15 min, so a 5-min ping keeps it permanently warm.

## shm-dashboard → Vercel

[vercel.json](shm-dashboard/vercel.json) sets the framework, build command, and SPA rewrites.

1. **Vercel → Add New → Project → Import** the same repo.
2. Set **Root Directory** = `web/shm-dashboard`. Framework should auto-detect as **Vite**.
3. **Environment Variables** — paste from `web/shm-dashboard/.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` — set to your Render URL, e.g. `https://shm-api.onrender.com`
4. **Deploy**. ~1 min to build.

## After both are deployed

5. Go back to the Render `shm-api` service and update `CORS_ORIGIN` to the actual Vercel URL (e.g. `https://shm-dashboard.vercel.app`). Save → Render will redeploy.
6. (If using TTN) Update the TTN webhook URL to `https://<your-render-app>.onrender.com/api/ingest/ttn`.

## Local-vs-deployed env at a glance

| Var                          | Local                     | Deployed                                        |
|------------------------------|---------------------------|-------------------------------------------------|
| `CORS_ORIGIN`                | `http://localhost:5173,http://localhost:5174` | `https://<your-dashboard>.vercel.app`           |
| `VITE_API_BASE_URL`          | `http://localhost:8080`   | `https://<your-api>.onrender.com`               |
| `TTN_WEBHOOK_SECRET`         | locally-generated         | regenerate with `openssl rand -hex 32`          |
