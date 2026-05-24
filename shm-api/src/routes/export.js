import { Router } from 'express';
import { sb } from '../lib/supabase.js';

const router = Router();

router.get('/readings.csv', async (req, res) => {
  let query = sb
    .from('readings')
    .select('received_at, deflection_mm, accel_ms2, velocity_ms, f_cnt, rssi, snr, latency_ms, device_id')
    .order('received_at', { ascending: true })
    .limit(10000);

  if (req.query.device_id) query = query.eq('device_id', req.query.device_id);
  if (req.query.from)      query = query.gte('received_at', req.query.from);
  if (req.query.to)        query = query.lte('received_at', req.query.to);

  const { data, error } = await query;
  if (error) return res.status(500).send(error.message);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="readings.csv"');
  res.write('received_at,deflection_mm,accel_ms2,velocity_ms,f_cnt,rssi,snr,latency_ms\n');
  for (const r of data ?? []) {
    res.write(
      `${r.received_at},${r.deflection_mm},${r.accel_ms2 ?? ''},${r.velocity_ms ?? ''},${r.f_cnt ?? ''},${r.rssi ?? ''},${r.snr ?? ''},${r.latency_ms ?? ''}\n`
    );
  }
  res.end();
});

export default router;
