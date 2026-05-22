import type { Reading } from '../supabase';

type Level = {
  label: string;
  color: string;
  bg: string;
};

function classify(maxAbsMm: number): Level {
  if (maxAbsMm < 10.99)  return { label: 'SAFE',                                    color: '#0f5132', bg: '#d1e7dd' };
  if (maxAbsMm < 20)     return { label: 'ALERT LEVEL 1 — MODERATE',                color: '#664d03', bg: '#fff3cd' };
  if (maxAbsMm < 30)     return { label: 'ALERT LEVEL 2 — HIGH',                    color: '#842029', bg: '#f8d7da' };
  if (maxAbsMm < 81.417) return { label: 'ALERT LEVEL 3 — CRITICAL',                color: '#fff',    bg: '#b02a37' };
  return                       { label: 'ALERT LEVEL 4 — SERVICEABILITY LIMIT EXCEEDED', color: '#fff', bg: '#6a040f' };
}

export function AlertBanner({ rows }: { rows: Reading[] }) {
  if (rows.length === 0) return null;

  const maxAbs = rows.reduce((m, r) => Math.max(m, Math.abs(Number(r.deflection_mm))), 0);
  const level = classify(maxAbs);

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 10,
        background: level.bg,
        color: level.color,
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <span>{level.label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>peak |Δ| = {maxAbs.toFixed(2)} mm</span>
    </div>
  );
}
