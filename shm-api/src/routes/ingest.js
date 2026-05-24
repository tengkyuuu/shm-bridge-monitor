import { Router } from 'express';
import { sb } from '../lib/supabase.js';
import { decodePayload } from '../lib/decode.js';

const router = Router();

function requireSecret(req, res, next) {
  if (req.header('X-Webhook-Secret') !== process.env.TTN_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }
  next();
}

router.post('/ttn', requireSecret, async (req, res) => {
  const m = req.body ?? {};

  if (m.uplink_message?.f_port !== 1) return res.sendStatus(204);

  const b64 = m.uplink_message?.frm_payload;
  if (typeof b64 !== 'string') return res.status(400).send('missing frm_payload');

  const raw = Buffer.from(b64, 'base64');
  if (raw.length !== 2 && raw.length !== 6) return res.status(400).send('bad length');

  const devEuiRaw = m.end_device_ids?.dev_eui;
  if (typeof devEuiRaw !== 'string') return res.status(400).send('missing dev_eui');
  const devEui = devEuiRaw.toUpperCase();

  // Look up the device; insert a new row only if it doesn't exist yet.
  // This preserves any custom name the operator set in Supabase Table Editor.
  let { data: device, error: deviceErr } = await sb
    .from('devices')
    .select()
    .eq('dev_eui', devEui)
    .maybeSingle();
  if (deviceErr) return res.status(500).send(deviceErr.message);

  if (!device) {
    const { data: created, error: createErr } = await sb
      .from('devices')
      .insert({ dev_eui: devEui, name: 'JRMSU Bridge Sensor' })
      .select()
      .single();
    if (createErr) return res.status(500).send(createErr.message);
    device = created;
  }

  const decoded = m.uplink_message.decoded_payload ?? {};
  const fallback = decodePayload(raw);

  // Pipeline latency: ms between TTN receiving the LoRa uplink and this API
  // persisting the row. Includes TTN → Render webhook delivery + this handler's
  // pre-write work. Does NOT include browser propagation (Realtime push) since
  // that depends on the viewer.
  const receivedAtMs = Date.parse(m.uplink_message.received_at);
  const latencyMs = Number.isFinite(receivedAtMs)
    ? Math.max(0, Date.now() - receivedAtMs)
    : null;

  const reading = {
    device_id:     device.id,
    received_at:   m.uplink_message.received_at,
    deflection_mm: decoded.deflection_mm ?? fallback.deflection_mm,
    accel_ms2:     decoded.accel_ms2     ?? fallback.accel_ms2,
    velocity_ms:   decoded.velocity_ms   ?? fallback.velocity_ms,
    f_cnt:         m.uplink_message.f_cnt ?? null,
    rssi:          m.uplink_message.rx_metadata?.[0]?.rssi ?? null,
    snr:           m.uplink_message.rx_metadata?.[0]?.snr  ?? null,
    latency_ms:    latencyMs,
  };

  const { error: insertErr } = await sb.from('readings').insert(reading);
  if (insertErr && insertErr.code !== '23505') {
    return res.status(500).send(insertErr.message);
  }

  await sb.from('devices')
    .update({ last_seen_at: reading.received_at })
    .eq('id', device.id);

  res.sendStatus(200);
});

export default router;
