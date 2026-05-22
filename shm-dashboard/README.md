# shm-dashboard

Single-page React + Vite app. Subscribes to the `readings` table via Supabase Realtime and renders current deflection, a chart, and a table. Hits `shm-api` for CSV export.

## Local run
```
cp .env.example .env       # fill in keys
npm install
npm run dev
```
Open the printed URL (default `http://localhost:5173`).
