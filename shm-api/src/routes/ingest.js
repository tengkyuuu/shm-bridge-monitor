import { Router } from 'express';
import { sb } from '../lib/supabase.js';
import { decodeDeflection } from '../lib/decode.js';

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
  if (raw.length !== 2) return res.status(400).send('bad length');

  const devEuiRaw = m.end_device_ids?.dev_eui;
  if (typeof devEuiRaw !== 'string') return res.status(400).send('missing dev_eui');
  const devEui = devEuiRaw.toUpperCase();

  const { data: device, error: deviceErr } = await sb
    .from('devices')
    .upsert({ dev_eui: devEui, name: 'Bridge Node' }, { onConflict: 'dev_eui' })
    .select()
    .single();

  if (deviceErr) return res.status(500).send(deviceErr.message);

  const decoded = m.uplink_message.decoded_payload ?? {};
  const reading = {
    device_id:     device.id,
    received_at:   m.uplink_message.received_at,
    deflection_mm: decoded.deflection_mm ?? decodeDeflection(raw),
    accel_ms2:     decoded.accel_ms2   ?? null,
    velocity_ms:   decoded.velocity_ms ?? null,
    f_cnt:         m.uplink_message.f_cnt ?? null,
    rssi:          m.uplink_message.rx_metadata?.[0]?.rssi ?? null,
    snr:           m.uplink_message.rx_metadata?.[0]?.snr  ?? null,
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
