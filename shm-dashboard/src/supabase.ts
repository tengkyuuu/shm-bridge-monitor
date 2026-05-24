import { createClient } from '@supabase/supabase-js';

export type Reading = {
  id: number;
  device_id: number;
  received_at: string;
  deflection_mm: number;
  accel_ms2: number | null;
  velocity_ms: number | null;
  f_cnt: number | null;
  rssi: number | null;
  snr: number | null;
  latency_ms: number | null;
  created_at: string;
};

export type Device = {
  id: number;
  dev_eui: string;
  name: string;
  last_seen_at: string | null;
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
