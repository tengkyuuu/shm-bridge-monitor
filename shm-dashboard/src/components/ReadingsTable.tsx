import type { Reading } from '../supabase';

function fmt(v: number | null | undefined, digits: number) {
  if (v == null) return '';
  return Number(v).toFixed(digits);
}

export function ReadingsTable({ rows }: { rows: Reading[] }) {
  const recent = rows.slice().reverse();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f4f4f5' }}>
            <th style={th}>received_at</th>
            <th style={th}>accel (m/s²)</th>
            <th style={th}>velocity (m/s)</th>
            <th style={th}>deflection (mm)</th>
            <th style={th}>f_cnt</th>
            <th style={th}>rssi</th>
            <th style={th}>snr</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
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

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '6px 12px' };
const tdNum: React.CSSProperties = { ...td, fontVariantNumeric: 'tabular-nums' };
