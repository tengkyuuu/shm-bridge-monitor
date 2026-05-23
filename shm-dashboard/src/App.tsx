import { useEffect, useMemo, useState } from 'react';
import { useDevices } from './lib/useDevices';
import { useReadingsStream } from './lib/useReadingsStream';
import { CurrentReading } from './components/CurrentReading';
import { MultiChannelChart } from './components/MultiChannelChart';
import { ReadingsTable } from './components/ReadingsTable';
import { AlertBanner } from './components/AlertBanner';
import { DeviceSelector } from './components/DeviceSelector';
import { CsvDownload } from './components/CsvDownload';
import { ThemeToggle } from './theme';

// Connection status thresholds (ms)
const LIVE_THRESHOLD_MS  = 30_000;   // < 30 s → LIVE
const STALE_THRESHOLD_MS = 120_000;  // < 2 min → STALE, else OFFLINE
const RECOMPUTE_INTERVAL_MS = 1000;

type Status = 'live' | 'stale' | 'offline' | 'no-data';

function useStatus(lastReceivedAt: string | null | undefined): { status: Status; ageS: number } {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), RECOMPUTE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  if (!lastReceivedAt) return { status: 'no-data', ageS: 0 };
  const ageMs = Math.max(0, now - new Date(lastReceivedAt).getTime());
  const ageS = Math.floor(ageMs / 1000);
  if (ageMs < LIVE_THRESHOLD_MS) return { status: 'live', ageS };
  if (ageMs < STALE_THRESHOLD_MS) return { status: 'stale', ageS };
  return { status: 'offline', ageS };
}

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

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === deviceId) ?? null,
    [devices, deviceId],
  );

  const latest = rows[rows.length - 1];
  const { status, ageS } = useStatus(latest?.received_at);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={brandCol}>
          <div style={brandLine}>
            <span style={brandDot} />
            <span style={brandText}>SHM Bridge Monitor</span>
          </div>
          <h1 style={deviceNameStyle}>
            {selectedDevice?.name ?? (loading ? 'Loading…' : 'No device')}
          </h1>
          {selectedDevice ? (
            <div style={deviceMetaStyle}>
              <span>DevEUI {selectedDevice.dev_eui}</span>
              <span style={dotSep}>·</span>
              <ConnectionPill status={status} ageS={ageS} />
            </div>
          ) : null}
        </div>

        <div style={headerActions}>
          <DeviceSelector devices={devices} value={deviceId} onChange={setDeviceId} />
          <ThemeToggle />
        </div>
      </header>

      <AlertBanner rows={rows} status={status} />

      <section style={{ marginBottom: 20 }}>
        <CurrentReading rows={rows} status={status} ageS={ageS} />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Sensor channels <span style={h2Sub}>(last 30 min)</span></h2>
        <MultiChannelChart rows={rows} />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Recent readings</h2>
        <ReadingsTable rows={rows} />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Export</h2>
        <CsvDownload apiBase={apiBase} deviceId={deviceId} />
        <p style={hintStyle}>
          Leave dates blank to export the full history for the selected device.
        </p>
      </section>

      {loading && rows.length === 0 ? (
        <p style={hintStyle}>Loading devices…</p>
      ) : null}
    </div>
  );
}

function ConnectionPill({ status, ageS }: { status: Status; ageS: number }) {
  if (status === 'no-data') {
    return (
      <span style={pillStyle('offline')}>
        <span style={dotStyle('offline')} className="status-dot-pulse" />
        <span>No data</span>
      </span>
    );
  }
  const label =
    status === 'live'    ? `Live · ${ageS}s ago`
  : status === 'stale'   ? `Stale · ${ageS}s ago`
  :                        `Offline · ${ageS}s ago`;
  return (
    <span style={pillStyle(status)}>
      <span style={dotStyle(status)} className={status === 'offline' ? 'status-dot-pulse' : undefined} />
      <span>{label}</span>
    </span>
  );
}

function pillStyle(status: Exclude<Status, 'no-data'> | 'offline'): React.CSSProperties {
  const colorMap = {
    live:    { color: 'var(--status-live)',    bg: 'var(--status-live-bg)' },
    stale:   { color: 'var(--status-stale)',   bg: 'var(--status-stale-bg)' },
    offline: { color: 'var(--status-offline)', bg: 'var(--status-offline-bg)' },
  } as const;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 999,
    background: colorMap[status].bg,
    color: colorMap[status].color,
    fontSize: 12,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  };
}

function dotStyle(status: Exclude<Status, 'no-data'> | 'offline'): React.CSSProperties {
  const colorMap = {
    live:    'var(--status-live)',
    stale:   'var(--status-stale)',
    offline: 'var(--status-offline)',
  } as const;
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: colorMap[status],
    display: 'inline-block',
  };
}

const pageStyle: React.CSSProperties = {
  maxWidth: 1040,
  margin: '0 auto',
  padding: '32px 20px 48px',
  color: 'var(--fg)',
};
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 24,
  gap: 16,
  flexWrap: 'wrap',
};
const brandCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const brandLine: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const brandDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 2,
  background: 'var(--accent)',
};
const brandText: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 1.2,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
};
const deviceNameStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: -0.3,
  color: 'var(--fg)',
};
const deviceMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: 'var(--fg-dim)',
  fontVariantNumeric: 'tabular-nums',
  flexWrap: 'wrap',
};
const dotSep: React.CSSProperties = { color: 'var(--fg-dim)' };
const headerActions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};
const sectionStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: 20,
  border: '1px solid var(--border)',
  borderRadius: 14,
  background: 'var(--card)',
  boxShadow: 'var(--shadow-sm)',
};
const h2Style: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};
const h2Sub: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--fg-dim)',
  textTransform: 'none',
  letterSpacing: 0,
  marginLeft: 6,
};
const hintStyle: React.CSSProperties = {
  color: 'var(--fg-dim)',
  fontSize: 13,
  marginTop: 10,
};
