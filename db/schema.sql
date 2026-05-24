-- SHM Web Dashboard — Supabase schema
-- Paste into the Supabase SQL editor. After running:
--   1. Database → Replication → enable Realtime for `readings`
--   2. Authentication → Policies → add RLS policies:
--        - readings, devices: SELECT for role `anon`
--        - all writes restricted to `service_role` (the backend uses this key)

create table devices (
  id           bigserial primary key,
  dev_eui      text not null unique,
  name         text not null default 'Bridge Node',
  last_seen_at timestamptz
);

create table readings (
  id            bigserial primary key,
  device_id     bigint not null references devices(id) on delete cascade,
  received_at   timestamptz not null,
  deflection_mm numeric(8,2) not null,
  accel_ms2     numeric(8,4),
  velocity_ms   numeric(8,4),
  f_cnt         integer,
  rssi          integer,
  snr           numeric(5,2),
  latency_ms    integer,
  created_at    timestamptz not null default now()
);

create index on readings(device_id, received_at desc);
create unique index on readings(device_id, f_cnt) where f_cnt is not null;

-- DevEUI from WIRELESSBRIDGE.ino (MSB hex of 0x99 77 66 55 44 33 22 11)
insert into devices(dev_eui, name) values ('1122334455667799', 'Miputak Dacu Node');

-- RLS policies (run separately after enabling RLS on the tables)
-- alter table devices  enable row level security;
-- alter table readings enable row level security;
-- create policy "anon read devices"  on devices  for select to anon using (true);
-- create policy "anon read readings" on readings for select to anon using (true);
