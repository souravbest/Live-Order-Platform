import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { type Order, type OrderStatus } from '../../lib/api';

export type SortField = keyof Order;
export type SortDir = 'asc' | 'desc';

export interface GridState {
  search: string;
  statusFilter: string;
  sortField: SortField;
  sortDir: SortDir;
  selectedId: string | null;
}

export function useGridState() {
  const [params, setParams] = useSearchParams();

  const state: GridState = {
    search: params.get('search') ?? '',
    statusFilter: params.get('status') ?? '',
    sortField: (params.get('sortField') as SortField) ?? 'createdAt',
    sortDir: (params.get('sortDir') as SortDir) ?? 'desc',
    selectedId: params.get('order') ?? null,
  };

  const setSearch = useCallback((v: string) => {
    setParams((p) => { const n = new URLSearchParams(p); n.set('search', v); return n; });
  }, [setParams]);

  const setStatusFilter = useCallback((v: string) => {
    setParams((p) => { const n = new URLSearchParams(p); n.set('status', v); return n; });
  }, [setParams]);

  const setSort = useCallback((field: SortField) => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      const curDir = (p.get('sortDir') as SortDir) ?? 'desc';
      n.set('sortField', field);
      n.set('sortDir', p.get('sortField') === field && curDir === 'asc' ? 'desc' : 'asc');
      return n;
    });
  }, [setParams]);

  const setSelectedId = useCallback((id: string | null) => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (id) {
        n.set('order', id);
      } else {
        n.delete('order');
      }
      return n;
    });
  }, [setParams]);

  return { state, setSearch, setStatusFilter, setSort, setSelectedId };
}

// Filter + sort logic — runs outside the component to avoid re-renders
export function applyGridFilters(
  orders: Order[],
  { search, statusFilter, sortField, sortDir }: GridState,
): Order[] {
  let result = orders;

  if (search) {
    const lower = search.toLowerCase();
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(lower) ||
        o.customer.toLowerCase().includes(lower),
    );
  }

  if (statusFilter) {
    result = result.filter((o) => o.status === statusFilter);
  }

  result = [...result].sort((a, b) => {
    const av = a[sortField] as string;
    const bv = b[sortField] as string;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return result;
}

export const ALL_STATUSES: OrderStatus[] = [
  'Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Held', 'Cancelled',
];
