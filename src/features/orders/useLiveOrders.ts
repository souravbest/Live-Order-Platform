import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api, SSEEventSchema, type Order } from '../../lib/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const MAX_RECONNECT_MS = Number(import.meta.env.VITE_SSE_RECONNECT_MAX_MS) || 30000;

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export function useLiveOrders() {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const retryDelay = useRef(1000);
  const esRef = useRef<EventSource | null>(null);

  const { data: orders = [], isLoading, error } = useQuery<Order[], Error>({
    queryKey: ['orders'],
    queryFn: api.getOrders,
    staleTime: Infinity, // SSE drives freshness
  });

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      const es = new EventSource(`${API_BASE}/api/events`);
      esRef.current = es;

      es.onmessage = (event) => {
        const raw = JSON.parse(event.data);
        const result = SSEEventSchema.safeParse(raw);
        if (!result.success) return; // silently drop invalid events

        const parsed = result.data;

        if (parsed.type === 'connected') {
          setConnectionStatus('connected');
          retryDelay.current = 1000; // reset backoff
        } else if (parsed.type === 'update') {
          const updates = parsed.payload;

          // Merge updates into React Query cache without full re-render
          queryClient.setQueryData(['orders'], (oldData: Order[] | undefined) => {
            if (!oldData) return oldData;
            const map = new Map(oldData.map((o) => [o.id, o]));
            updates.forEach((u) => map.set(u.id, u));
            return Array.from(map.values());
          });

          // aria-live announcement for critical status changes
          const critical = updates.filter((u) => u.status === 'Held' || u.status === 'Cancelled');
          if (critical.length > 0) {
            setLiveAnnouncement(
              `${critical.length} order${critical.length > 1 ? 's' : ''} now ${critical[0].status}.`
            );
          }
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        es.close();
        setConnectionStatus('disconnected');

        // Exponential backoff with jitter, capped at MAX_RECONNECT_MS
        const delay = Math.min(retryDelay.current, MAX_RECONNECT_MS);
        retryDelay.current = Math.min(retryDelay.current * 2, MAX_RECONNECT_MS);
        setConnectionStatus('reconnecting');

        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isMounted = false;
      esRef.current?.close();
    };
  }, [queryClient]);

  return { orders, isLoading, error, connectionStatus, liveAnnouncement };
}
