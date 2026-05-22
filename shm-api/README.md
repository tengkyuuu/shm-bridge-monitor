# shm-api

Express ingest + CSV export.

## Endpoints
- `GET  /api/health` → `{ ok: true }`
- `POST /api/ingest/ttn` → accepts TTN uplink JSON, requires header `X-Webhook-Secret`.
- `GET  /api/export/readings.csv?device_id=&from=&to=` → streaming CSV.

## Local run
```
cp .env.example .env       # fill in keys
npm install
npm run dev
```

## Quick curl smoke test
```bash
curl -X POST http://localhost:8080/api/ingest/ttn \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $TTN_WEBHOOK_SECRET" \
  -d '{
    "end_device_ids": { "dev_eui": "1122334455667799" },
    "uplink_message": {
      "f_port": 1,
      "f_cnt": 0,
      "received_at": "2026-05-22T00:00:00Z",
      "frm_payload": "AAo=",
      "rx_metadata": [{ "rssi": -80, "snr": 7.5 }]
    }
  }'
```
`frm_payload` `"AAo="` decodes to bytes `[0x00, 0x0A]` → `int16 = 10` → `0.10 mm`.
