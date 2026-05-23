import { useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, type Reading } from '../supabase';

// Strategy:
//   1. Initial fetch of last N rows.
//   2. Subscribe to INSERT events for this device.
//   3. If the channel closes/errors/times out, recreate it after a short delay.
//   4. On every successful (re)subscribe, refetch so any rows we missed
//      during the disconnect are pulled in.
//   5. When the browser tab becomes visible again, refetch immediately
//      (background tabs throttle setInterval and may miss realtime pushes).
//   6. Dedup incoming INSERTs by row id so the refetch + live push race
//      never produces duplicate rows.

const RECONNECT_DELAY_MS = 2000;

export function useReadingsStream(deviceId: number | null, limit = 100) {
  const [rows, setRows] = useState<Reading[]>([]);

  useEffect(() => {
    if (deviceId == null) {
      setRows([]);
      return;
    }

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    setRows([]);

    const fetchLatest = async () => {
      const { data } = await supabase
        .from('readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('received_at', { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setRows(((data ?? []) as Reading[]).slice().reverse());
    };

    const setupChannel = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }

      // Unique channel name per attempt — avoids name collisions during reconnect.
      channel = supabase
        .channel(`readings:${deviceId}:${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'readings',
            filter: `device_id=eq.${deviceId}`,
          },
          (p) => {
            const next = p.new as Reading;
            setRows((prev) => {
              if (prev.some((r) => r.id === next.id)) return prev;
              return [...prev.slice(-(limit - 1)), next];
            });
          },
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === 'SUBSCRIBED') {
            // (Re)connected — refetch to bridge any gap from the disconnect.
            fetchLatest();
          } else if (
            status === 'CLOSED' ||
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT'
          ) {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              if (!cancelled) setupChannel();
            }, RECONNECT_DELAY_MS);
          }
        });
    };

    const onVisible = () => {
      if (!cancelled && document.visibilityState === 'visible') {
        fetchLatest();
      }
    };

    fetchLatest();
    setupChannel();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [deviceId, limit]);

  return rows;
}
