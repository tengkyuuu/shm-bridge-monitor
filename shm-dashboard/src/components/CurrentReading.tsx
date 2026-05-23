import type { Reading } from '../supabase';
import { useTweenedNumber } from '../lib/useTweenedNumber';

type Status = 'live' | 'stale' | 'offline' | 'no-data';

type Props = {
  rows: Reading[];
  status: Status;
  ageS: number;
};

export function CurrentReading({ rows, status, ageS }: Props) {
  const latest = rows[rows.length - 1];

  if (!latest) {
    return (
      <div style={cardStyle()}>
        <div style={labelStyle}>Current deflection</div>
        <div style={bigStyle}>— mm</div>
        <div style={subStatLabel}>Waiting for first reading…</div>
      </div>
    );
  }

  const isOffline = status === 'offline' || status === 'no-data';
  const isStale = status === 'stale';
  const dimmed = isOffline || isStale;

  // Smoothly tween the displayed values between LoRa packets so the dashboard
  // *feels* continuous even though packets arrive every 10s. When the sensor is
  // offline, `latest` doesn't change, so the tween naturally holds the last value.
  const animatedDeflection = useTweenedNumber(Number(latest.deflection_mm), 800);
  const animatedAccel      = useTweenedNumber(latest.accel_ms2 == null ? 0 : Number(latest.accel_ms2), 800);
  const animatedVelocity   = useTweenedNumber(latest.velocity_ms == null ? 0 : Number(latest.velocity_ms), 800);

  return (
    <div style={cardStyle(isOffline)}>
      <div style={labelStyle}>Current deflection</div>

      <div style={{ ...bigStyle, opacity: dimmed ? 0.4 : 1, transition: 'opacity 200ms ease' }}>
        {animatedDeflection.toFixed(2)} mm
      </div>

      <div style={subRowStyle}>
        <SubStat
          label="acceleration"
          value={latest.accel_ms2 == null ? '— m/s²' : `${animatedAccel.toFixed(3)} m/s²`}
          dimmed={dimmed}
        />
        <SubStat
          label="velocity"
          value={latest.velocity_ms == null ? '— m/s' : `${animatedVelocity.toFixed(4)} m/s`}
          dimmed={dimmed}
        />
        <SubStat label="last seen" value={`${ageS}s ago`} dimmed={false} />
      </div>
    </div>
  );
}

function SubStat({ label, value, dimmed }: { label: string; value: string; dimmed: boolean }) {
  return (
    <div style={{ ...subStat, opacity: dimmed ? 0.4 : 1 }}>
      <span style={subStatLabel}>{label}</span>
      <span style={subStatValue}>{value}</span>
    </div>
  );
}

function cardStyle(offline = false): React.CSSProperties {
  return {
    padding: '24px',
    border: `1px solid ${offline ? 'var(--status-offline)' : 'var(--border)'}`,
    borderRadius: 14,
    background: 'var(--card)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'border-color 200ms ease',
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 600,
};
const bigStyle: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 700,
  margin: '6px 0 16px',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: -1,
  lineHeight: 1.05,
};
const subRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 28,
  flexWrap: 'wrap',
};
const subStat: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  transition: 'opacity 200ms ease',
};
const subStatLabel: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--fg-dim)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontWeight: 500,
};
const subStatValue: React.CSSProperties = {
  fontSize: 15,
  color: 'var(--fg)',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 500,
};
