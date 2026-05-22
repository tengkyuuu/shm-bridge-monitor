# SHM Web Dashboard

Monorepo for the LoRaWAN → Web pipeline that complements the [WIRELESSBRIDGE.ino](../WIRELESSBRIDGE.ino) firmware.

```
WIRELESSBRIDGE.ino  →  TTN  →  shm-api (Express)  →  Supabase (Postgres + Realtime)
                                                              │
                                                              ▼
                                                shm-dashboard (React + Vite)
```

## Layout
- `db/schema.sql` — Supabase schema + seed (the device row).
- `shm-api/` — Express. Accepts the TTN webhook, decodes the 2-byte payload, inserts one row per uplink. Also serves `/api/export/readings.csv`.
- `shm-dashboard/` — React + Vite single-page app. Subscribes to `readings` via Supabase Realtime.
- `tools/ttn-simulator.js` — Posts TTN-shaped JSON to the API every 30 s so you can drive the dashboard without a real LoRaWAN gateway.

## Run order (local demo, no hardware)
1. **Supabase**: create a project, run `db/schema.sql` in the SQL editor, enable Realtime on `readings`, add anon-read RLS policies, copy your URL + service-role key + anon key.
2. **API**: `cd shm-api`, copy `.env.example` → `.env`, fill the keys + a random `TTN_WEBHOOK_SECRET`, then `npm install && npm run dev`. Sanity-check: `curl http://localhost:8080/api/health` → `{"ok":true}`.
3. **Simulator**: in a second terminal, `node tools/ttn-simulator.js` (it reads the same `TTN_WEBHOOK_SECRET`). One row arrives every 30 s.
4. **Dashboard**: `cd shm-dashboard`, copy `.env.example` → `.env`, fill the URL + anon key + `VITE_API_BASE_URL=http://localhost:8080`, then `npm install && npm run dev`. Open the printed URL.

## Going live with TTN
Register the device on TTN using the DevEUI/JoinEUI/AppKey from [WIRELESSBRIDGE.ino](../WIRELESSBRIDGE.ino) lines 79–90 (DevEUI in MSB hex: `1122334455667799`). Paste the uplink payload formatter from §5 of [SHM_Web_Dashboard_Plan.md](../SHM_Web_Dashboard_Plan.md). Configure a custom webhook → URL `<your deployed shm-api>/api/ingest/ttn`, JSON format, Uplink only, additional header `X-Webhook-Secret: <same value as the API .env>`.
