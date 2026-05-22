import { useEffect, useState } from 'react';
import { supabase, type Reading } from '../supabase';

export function useReadingsStream(deviceId: number | null, limit = 100) {
  const [rows, setRows] = useState<Reading[]>([]);

  useEffect(() => {
    if (deviceId == null) {
      setRows([]);
      return;
    }

    let cancelled = false;
    setRows([]);

    supabase
      .from('readings')
      .select('*')
      .eq('device_id', deviceId)
      .order('received_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (cancelled) return;
        setRows(((data ?? []) as Reading[]).slice().reverse());
      });

    const ch = supabase
      .channel(`readings:${deviceId}`)
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
          setRows((prev) => [...prev.slice(-(limit - 1)), next]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [deviceId, limit]);

  return rows;
}
