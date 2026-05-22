import { useEffect, useState } from 'react';
import { useDevices } from './lib/useDevices';
import { useReadingsStream } from './lib/useReadingsStream';
import { CurrentReading } from './components/CurrentReading';
import { MultiChannelChart } from './components/MultiChannelChart';
import { ReadingsTable } from './components/ReadingsTable';
import { AlertBanner } from './components/AlertBanner';
import { DeviceSelector } from './components/DeviceSelector';
import { CsvDownload } from './components/CsvDownload';

export default function App() {
  const { devices, loading } = useDevices();
  const [deviceId, setDeviceId] = useState<number | null>(null);

  useEffect(() => {
    if (deviceId == null && devices.length > 0) {
      setDeviceId(devices[0].id);
    }
  }, [devices, deviceId]);

  const rows = useReadingsStream(deviceId, 100);
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Structural Health Monitor</h1>
        <DeviceSelector devices={devices} value={deviceId} onChange={setDeviceId} />
      </header>

      <AlertBanner rows={rows} />

      <section style={{ marginBottom: 24 }}>
        <CurrentReading rows={rows} />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Sensor channels (last 30 min)</h2>
        <MultiChannelChart rows={rows} />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Recent readings</h2>
        <ReadingsTable rows={rows} />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Export</h2>
        <CsvDownload apiBase={apiBase} deviceId={deviceId} />
        <p style={{ color: '#888', fontSize: 13, marginTop: 10 }}>
          Leave dates blank to export everything for the selected device.
        </p>
      </section>

      {loading && rows.length === 0 ? (
        <p style={{ color: '#888', fontSize: 13 }}>Loading devices…</p>
      ) : null}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '32px 16px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#111',
};
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 24,
  flexWrap: 'wrap',
  gap: 12,
};
const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
  padding: 16,
  border: '1px solid #eee',
  borderRadius: 12,
  background: '#fff',
};
const h2Style: React.CSSProperties = { margin: '0 0 12px', fontSize: 16, color: '#444' };
