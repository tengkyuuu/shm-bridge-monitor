import type { Device } from '../supabase';

type Props = {
  devices: Device[];
  value: number | null;
  onChange: (id: number) => void;
};

export function DeviceSelector({ devices, value, onChange }: Props) {
  if (devices.length === 0) {
    return <span style={{ color: 'var(--fg-dim)', fontSize: 13 }}>No devices yet</span>;
  }

  // Hide the selector when there's only one device — name is shown in header
  if (devices.length === 1) return null;

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <span style={{ color: 'var(--fg-muted)', fontWeight: 500 }}>Device</span>
      <select value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </label>
  );
}
