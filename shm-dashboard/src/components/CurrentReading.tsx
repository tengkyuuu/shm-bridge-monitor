import type { Reading } from '../supabase';

type Status = 'live' | 'stale' | 'offline' | 'no-data';

type Props = {
  rows: Reading[];
  status: Status;
  ageS: number;
};

function fmt(value: number | null | undefined, digits: number, unit: string) {
  if (value == null) return `— ${unit}`;
  return `${Number(value).toFixed(digits)} ${unit}`;
}

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

  const isStale = status === 'stale';
  const isOffline = status === 'offline';

  return (
    <div style={cardStyle(isOffline)}>
      <div style={labelRow}>
        <div style={labelStyle}>Current deflection</div>
        {(isStale || isOffline) ? (
          <div style={warningTextStyle(isOffline)}>
            {isOffline
              ? `⚠ No data for ${ageS}s — sensor likely offline`
              : `Last reading ${ageS}s ago — connection slow`}
          </div>
        ) : null}
      </div>

      <div style={bigStyle}>
        <span style={isOffline ? { opacity: 0.45 } : undefined}>
          {Number(latest.deflection_mm).toFixed(2)} mm
        </span>
      </div>

      <div style={subRowStyle}>
        <SubStat label="acceleration" value={fmt(latest.accel_ms2, 3, 'm/s²')} dimmed={isOffline} />
        <SubStat label="velocity"     value={fmt(latest.velocity_ms, 4, 'm/s')}  dimmed={isOffline} />
        <SubStat label="last seen"    value={`${ageS}s ago`} dimmed={false} />
      </div>
    </div>
  );
}

function SubStat({ label, value, dimmed }: { label: string; value: string; dimmed: boolean }) {
  return (
    <div style={{ ...subStat, opacity: dimmed ? 0.5 : 1 }}>
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

const labelRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
};
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
  margin: '6px 0 12px',
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

function warningTextStyle(offline: boolean): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 600,
    color: offline ? 'var(--status-offline)' : 'var(--status-stale)',
  };
}
