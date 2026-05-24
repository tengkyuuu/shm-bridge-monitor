import type { Reading } from '../supabase';

function fmt(v: number | null | undefined, digits: number) {
  if (v == null) return '';
  return Number(v).toFixed(digits);
}

export function ReadingsTable({ rows }: { rows: Reading[] }) {
  const recent = rows.slice().reverse();

  if (recent.length === 0) {
    return <div style={emptyStyle}>No readings yet.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--subtle-bg)' }}>
            <th style={th}>Received</th>
            <th style={thNum}>Accel (m/s²)</th>
            <th style={thNum}>Velocity (m/s)</th>
            <th style={thNum}>Deflection (mm)</th>
            <th style={thNum}>Packet #</th>
            <th style={thNum}>Signal (dBm)</th>
            <th style={thNum}>Quality (dB)</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((r) => (
            <tr key={r.id} style={trStyle}>
              <td style={td}>{new Date(r.received_at).toLocaleString()}</td>
              <td style={tdNum}>{fmt(r.accel_ms2, 3)}</td>
              <td style={tdNum}>{fmt(r.velocity_ms, 4)}</td>
              <td style={tdNum}>{Number(r.deflection_mm).toFixed(2)}</td>
              <td style={tdNum}>{r.f_cnt ?? ''}</td>
              <td style={tdNum}>{r.rssi ?? ''}</td>
              <td style={tdNum}>{r.snr ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: 'var(--fg-muted)',
  borderBottom: '1px solid var(--border)',
};
const thNum: React.CSSProperties = { ...th, textAlign: 'right' };
const td: React.CSSProperties = {
  padding: '8px 12px',
  color: 'var(--fg)',
};
const tdNum: React.CSSProperties = {
  ...td,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--fg-muted)',
};
const trStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
};
const emptyStyle: React.CSSProperties = {
  padding: 20,
  color: 'var(--fg-dim)',
  fontSize: 13,
  textAlign: 'center',
};
