import type { Device } from '../supabase';

type Props = {
  devices: Device[];
  value: number | null;
  onChange: (id: number) => void;
};

export function DeviceSelector({ devices, value, onChange }: Props) {
  if (devices.length === 0) {
    return <span style={{ color: '#888', fontSize: 14 }}>No devices yet</span>;
  }

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
      <span style={{ color: '#666' }}>Device</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: '1px solid #ccc',
          background: '#fff',
        }}
      >
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.dev_eui})
          </option>
        ))}
      </select>
    </label>
  );
}
