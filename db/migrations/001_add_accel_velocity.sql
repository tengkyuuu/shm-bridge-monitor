-- Migration 001 — add acceleration + velocity columns to readings.
-- Paste into Supabase SQL Editor and Run. Safe to re-run (uses IF NOT EXISTS).
-- Existing rows get NULL for the new fields, which is fine — the dashboard
-- handles nulls gracefully.

alter table readings
  add column if not exists accel_ms2   numeric(8,4),
  add column if not exists velocity_ms numeric(8,4);
