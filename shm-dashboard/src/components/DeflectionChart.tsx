import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Reading } from '../supabase';

const WINDOW_MS = 30 * 60 * 1000;

export function DeflectionChart({ rows }: { rows: Reading[] }) {
  const cutoff = Date.now() - WINDOW_MS;
  const data = rows
    .map((r) => ({ t: new Date(r.received_at).getTime(), mm: Number(r.deflection_mm) }))
    .filter((d) => d.t >= cutoff);

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(t) => new Date(t).toLocaleTimeString()}
            scale="time"
          />
          <YAxis unit=" mm" />
          <Tooltip
            labelFormatter={(t) => new Date(t as number).toLocaleString()}
            formatter={(v) => [`${(v as number).toFixed(2)} mm`, 'deflection']}
          />
          <Line type="monotone" dataKey="mm" stroke="#0070f3" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
