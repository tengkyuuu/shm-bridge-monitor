-- Migration 002 — add pipeline-latency column to readings.
-- Captures the milliseconds elapsed between TTN receiving the LoRa uplink
-- (stored in `received_at`) and the API persisting the row to this database.
-- Computed server-side in shm-api at ingest time. Safe to re-run.

alter table readings
  add column if not exists latency_ms integer;
