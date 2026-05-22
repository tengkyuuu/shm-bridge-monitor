import { useMemo, useState } from 'react';

type Props = {
  apiBase: string;
  deviceId: number | null;
};

export function CsvDownload({ apiBase, deviceId }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const href = useMemo(() => {
    const params = new URLSearchParams();
    if (deviceId != null) params.set('device_id', String(deviceId));
    if (from) params.set('from', new Date(from).toISOString());
    if (to)   params.set('to',   new Date(`${to}T23:59:59`).toISOString());
    const qs = params.toString();
    return `${apiBase}/api/export/readings.csv${qs ? `?${qs}` : ''}`;
  }, [apiBase, deviceId, from, to]);

  return (
    <div style={wrap}>
      <label style={field}>
        <span style={lbl}>From</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={input} />
      </label>
      <label style={field}>
        <span style={lbl}>To</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={input} />
      </label>
      <a href={href} target="_blank" rel="noreferrer" style={btn}>
        Download CSV
      </a>
    </div>
  );
}

const wrap: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
};
const field: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 };
const lbl: React.CSSProperties = { color: '#666' };
const input: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #ccc',
  background: '#fff',
};
const btn: React.CSSProperties = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  fontSize: 14,
};
