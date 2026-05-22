// Fake TTN webhook poster. Mirrors the JSON shape that shm-api/src/routes/ingest.js expects.
// Usage:
//   TTN_WEBHOOK_SECRET=... node tools/ttn-simulator.js
//   TTN_WEBHOOK_SECRET=... API_URL=http://localhost:8080 INTERVAL_S=30 node tools/ttn-simulator.js

const API_URL    = process.env.API_URL    || 'http://localhost:8080';
const DEV_EUI    = (process.env.DEV_EUI   || '1122334455667799').toUpperCase();
const SECRET     = process.env.TTN_WEBHOOK_SECRET;
const INTERVAL_S = Number(process.env.INTERVAL_S || 30);
const AMPLITUDE  = Number(process.env.AMPLITUDE_MM || 5);
const PERIOD_S   = Number(process.env.PERIOD_S || 600);

if (!SECRET) {
  console.error('[sim] TTN_WEBHOOK_SECRET env var is required (must match shm-api .env).');
  process.exit(1);
}

let fcnt = Number(process.env.SIM_START_FCNT || 0);
const startMs = Date.now();

function encodeBigEndianInt16(mm) {
  let v = Math.round(mm * 100);
  if (v >  32767) v =  32767;
  if (v < -32768) v = -32768;
  if (v < 0) v += 0x10000;
  const buf = Buffer.from([(v >> 8) & 0xff, v & 0xff]);
  return buf.toString('base64');
}

function nextSample() {
  const t = (Date.now() - startMs) / 1000;
  const phase = (2 * Math.PI * t) / PERIOD_S;
  // Position = A·sin(φ) → velocity ∝ A·cos(φ) → accel ∝ -A·sin(φ).
  // The factors don't have physical meaning here — just give the dashboard
  // visibly distinct shapes in all three channels.
  const deflection_mm = AMPLITUDE * Math.sin(phase);
  const velocity_ms   = (AMPLITUDE / 1000) * Math.cos(phase) * 0.5;
  const accel_ms2     = -AMPLITUDE * Math.sin(phase) * 0.2;
  return { deflection_mm, velocity_ms, accel_ms2 };
}

async function send() {
  const s   = nextSample();
  const b64 = encodeBigEndianInt16(s.deflection_mm);
  const body = {
    end_device_ids: { dev_eui: DEV_EUI },
    uplink_message: {
      f_port: 1,
      f_cnt: fcnt,
      received_at: new Date().toISOString(),
      frm_payload: b64,
      decoded_payload: {
        deflection_mm: Number(s.deflection_mm.toFixed(2)),
        velocity_ms:   Number(s.velocity_ms.toFixed(4)),
        accel_ms2:     Number(s.accel_ms2.toFixed(3)),
      },
      rx_metadata: [{ rssi: -70 - Math.floor(Math.random() * 20), snr: 5 + Math.random() * 5 }],
    },
  };

  try {
    const resp = await fetch(`${API_URL}/api/ingest/ttn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': SECRET,
      },
      body: JSON.stringify(body),
    });
    console.log(
      `[sim] f_cnt=${fcnt}  mm=${s.deflection_mm.toFixed(2)}  v=${s.velocity_ms.toFixed(4)}  a=${s.accel_ms2.toFixed(3)}  → ${resp.status}`
    );
  } catch (err) {
    console.error(`[sim] POST failed:`, err.message);
  }
  fcnt++;
}

console.log(`[sim] posting to ${API_URL}/api/ingest/ttn every ${INTERVAL_S}s as ${DEV_EUI}`);
send();
setInterval(send, INTERVAL_S * 1000);
