import { useEffect, useState } from 'react';
import type { Reading } from '../supabase';

type Status = 'live' | 'stale' | 'offline' | 'no-data';

const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

type Level = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

function classify(maxAbsMm: number): Level {
  if (maxAbsMm < 10.99)  return { label: 'SAFE',                                            color: '#0f5132', bg: '#d1e7dd', border: '#86b59c' };
  if (maxAbsMm < 20)     return { label: 'ALERT LEVEL 1 — MODERATE',                        color: '#664d03', bg: '#fff3cd', border: '#d6b94f' };
  if (maxAbsMm < 30)     return { label: 'ALERT LEVEL 2 — HIGH',                            color: '#842029', bg: '#f8d7da', border: '#d28a91' };
  if (maxAbsMm < 81.417) return { label: 'ALERT LEVEL 3 — CRITICAL',                        color: '#ffffff', bg: '#b02a37', border: '#b02a37' };
  return                       { label: 'ALERT LEVEL 4 — SERVICEABILITY LIMIT EXCEEDED',    color: '#ffffff', bg: '#6a040f', border: '#6a040f' };
}

export function AlertBanner({ rows, status }: { rows: Reading[]; status?: Status }) {
  // Force a re-render every 10s so the alert auto-decays as old readings fall outside the window
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  if (rows.length === 0) return null;

  const cutoff = Date.now() - WINDOW_MS;
  const recent = rows.filter((r) => new Date(r.received_at).getTime() >= cutoff);

  if (recent.length === 0) {
    return (
      <div style={offlineBannerStyle}>
        <span>NO RECENT DATA — sensor stale or offline</span>
        <span style={subStyle}>Alert level cannot be evaluated</span>
      </div>
    );
  }

  const maxAbs = recent.reduce((m, r) => Math.max(m, Math.abs(Number(r.deflection_mm))), 0);
  const level = classify(maxAbs);

  const isOffline = status === 'offline' || status === 'no-data';

  return (
    <div
      style={{
        padding: '12px 18px',
        borderRadius: 12,
        background: level.bg,
        color: level.color,
        border: `1px solid ${level.border}`,
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        opacity: isOffline ? 0.6 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>{level.label}</span>
        <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 500 }}>
          Based on peak deflection over the last 30 min · auto-clears when window passes
        </span>
      </div>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 14 }}>
        peak |Δ| = {maxAbs.toFixed(2)} mm
      </span>
    </div>
  );
}

const offlineBannerStyle: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: 12,
  background: 'var(--status-offline-bg)',
  color: 'var(--status-offline)',
  border: '1px solid var(--status-offline)',
  marginBottom: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
  fontWeight: 700,
};

const subStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  opacity: 0.85,
};
