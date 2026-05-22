import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Reading } from '../supabase';

const WINDOW_MS = 30 * 60 * 1000;

type Channel = {
  key: 'accel_ms2' | 'velocity_ms' | 'deflection_mm';
  title: string;
  unit: string;
  color: string;
  format: (v: number) => string;
};

const CHANNELS: Channel[] = [
  { key: 'accel_ms2',    title: 'Acceleration', unit: 'm/s²', color: '#ef4444', format: (v) => v.toFixed(3) },
  { key: 'velocity_ms',  title: 'Velocity',     unit: 'm/s',  color: '#10b981', format: (v) => v.toFixed(4) },
  { key: 'deflection_mm', title: 'Deflection',  unit: 'mm',   color: '#0070f3', format: (v) => v.toFixed(2) },
];

export function MultiChannelChart({ rows }: { rows: Reading[] }) {
  const cutoff = Date.now() - WINDOW_MS;
  const base = rows
    .map((r) => ({
      t: new Date(r.received_at).getTime(),
      accel_ms2:     r.accel_ms2     == null ? null : Number(r.accel_ms2),
      velocity_ms:   r.velocity_ms   == null ? null : Number(r.velocity_ms),
      deflection_mm: r.deflection_mm == null ? null : Number(r.deflection_mm),
    }))
    .filter((d) => d.t >= cutoff);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {CHANNELS.map((c) => {
        const hasData = base.some((d) => d[c.key] != null);
        return (
          <div key={c.key}>
            <div style={titleRow}>
              <span style={{ ...titleSwatch, background: c.color }} />
              <span style={titleText}>{c.title}</span>
              <span style={titleUnit}>({c.unit})</span>
              {!hasData ? <span style={waitingPill}>waiting for data</span> : null}
            </div>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={base} margin={{ top: 6, right: 16, bottom: 6, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                    scale="time"
                  />
                  <YAxis unit={` ${c.unit}`} width={80} />
                  <Tooltip
                    labelFormatter={(t) => new Date(t as number).toLocaleString()}
                    formatter={(v) => [v == null ? '—' : `${c.format(v as number)} ${c.unit}`, c.title]}
                  />
                  <Line
                    type="monotone"
                    dataKey={c.key}
                    stroke={c.color}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const titleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
  paddingLeft: 4,
};
const titleSwatch: React.CSSProperties = {
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: 2,
};
const titleText: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#333' };
const titleUnit: React.CSSProperties = { fontSize: 13, color: '#888' };
const waitingPill: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 11,
  color: '#888',
  background: '#f4f4f5',
  padding: '2px 8px',
  borderRadius: 999,
};
