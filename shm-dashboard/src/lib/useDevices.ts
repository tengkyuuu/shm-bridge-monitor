import { useEffect, useState } from 'react';
import { supabase, type Device } from '../supabase';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('devices')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setDevices((data ?? []) as Device[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { devices, loading };
}
