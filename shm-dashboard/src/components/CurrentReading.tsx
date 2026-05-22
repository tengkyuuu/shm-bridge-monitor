import { useEffect, useState } from 'react';
import type { Reading } from '../supabase';

function fmt(value: number | null | undefined, digits: number, unit: string) {
  if (value == null) return `— ${unit}`;
  return `${Number(value).toFixed(digits)} ${unit}`;
}

export function CurrentReading({ rows }: { rows: Reading[] }) {
  const latest = rows[rows.length - 1];
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!latest) {
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>Current deflection</div>
        <div style={bigStyle}>— mm</div>
        <div style={subStyle}>Waiting for first reading…</div>
      </div>
    );
  }

  const ageS = Math.max(0, Math.floor((now - new Date(latest.received_at).getTime()) / 1000));

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>Current deflection</div>
      <div style={bigStyle}>{Number(latest.deflection_mm).toFixed(2)} mm</div>

      <div style={subRowStyle}>
        <div style={subStat}>
          <span style={subStatLabel}>accel</span>
          <span style={subStatValue}>{fmt(latest.accel_ms2, 3, 'm/s²')}</span>
        </div>
        <div style={subStat}>
          <span style={subStatLabel}>velocity</span>
          <span style={subStatValue}>{fmt(latest.velocity_ms, 4, 'm/s')}</span>
        </div>
        <div style={subStat}>
          <span style={subStatLabel}>last seen</span>
          <span style={subStatValue}>{ageS}s ago</span>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: '24px',
  border: '1px solid #ddd',
  borderRadius: 12,
  background: '#fff',
};
const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: 1,
};
const bigStyle: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 700,
  margin: '8px 0',
  fontVariantNumeric: 'tabular-nums',
};
const subStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#888',
};
const subRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  flexWrap: 'wrap',
  marginTop: 8,
};
const subStat: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 };
const subStatLabel: React.CSSProperties = {
  fontSize: 11,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};
const subStatValue: React.CSSProperties = {
  fontSize: 14,
  color: '#333',
  fontVariantNumeric: 'tabular-nums',
};
