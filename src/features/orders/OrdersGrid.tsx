import React, { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Order } from '../../lib/api';
import { ALL_STATUSES, applyGridFilters, type GridState, type SortField, useGridState } from './useGridState';

interface OrdersGridProps {
  orders: Order[];
  onSelectOrder: (id: string) => void;
  selectedId: string | null;
}

const STATUS_CLASS: Record<string, string> = {
  Pending: 'status-pending', Processing: 'status-processing',
  Packed: 'status-packed', Shipped: 'status-shipped',
  Delivered: 'status-delivered', Held: 'status-held', Cancelled: 'status-cancelled',
};

function SortIcon({ field, state }: { field: SortField; state: GridState }) {
  if (state.sortField !== field) return <span style={{ color: '#4b5563' }}> ⇅</span>;
  return <span style={{ color: '#60a5fa' }}>{state.sortDir === 'asc' ? ' ↑' : ' ↓'}</span>;
}

export function OrdersGrid({ orders, onSelectOrder, selectedId }: OrdersGridProps) {
  const { state, setSearch, setStatusFilter, setSort } = useGridState();
  const [staleIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => applyGridFilters(orders, state),
    [orders, state],
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  });

  const thStyle: React.CSSProperties = {
    padding: '0.625rem 1rem',
    background: 'rgba(26,29,36,0.97)',
    backdropFilter: 'blur(8px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    fontWeight: 600,
    color: '#94a3b8',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    cursor: 'pointer',
    userSelect: 'none',
    borderBottom: '1px solid #2e3340',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  return (
    <div className="table-container" style={{ flex: 1 }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem',
        borderBottom: '1px solid #2e3340', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          type="search"
          placeholder="Search by ID or customer…"
          aria-label="Search orders"
          value={state.search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: '#0f1115', border: '1px solid #2e3340', borderRadius: '0.375rem',
            color: '#f8fafc', padding: '0.4rem 0.75rem', fontSize: '0.85rem',
            outline: 'none', flex: 1, minWidth: 180,
          }}
        />
        <select
          aria-label="Filter by status"
          value={state.statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: '#0f1115', border: '1px solid #2e3340', borderRadius: '0.375rem',
            color: '#f8fafc', padding: '0.4rem 0.75rem', fontSize: '0.85rem',
          }}
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: 'auto' }}>
          {filtered.length.toLocaleString()} orders
        </span>
      </div>

      {/* Virtualized Table */}
      <div ref={parentRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {(
                [
                  ['id',        'Order ID'],
                  ['customer',  'Customer'],
                  ['status',    'Status'],
                  ['items',     'Items'],
                  ['total',     'Total'],
                  ['createdAt', 'Created'],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <th
                  key={field}
                  style={thStyle}
                  onClick={() => setSort(field)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSort(field)}
                  aria-sort={
                    state.sortField === field
                      ? state.sortDir === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                >
                  {label}
                  <SortIcon field={field} state={state} />
                </th>
              ))}
            </tr>
          </thead>
        </table>

        <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const order = filtered[vRow.index];
            const isSelected = order.id === selectedId;
            const isStale = staleIds.has(order.id);

            return (
              <div
                key={order.id}
                role="row"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => onSelectOrder(order.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectOrder(order.id)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${vRow.size}px`,
                  transform: `translateY(${vRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1.2fr 0.5fr 0.8fr 1.5fr',
                  alignItems: 'center',
                  padding: '0 1rem',
                  borderBottom: '1px solid #2e3340',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(59,130,246,0.12)'
                    : 'transparent',
                  opacity: isStale ? 0.6 : 1,
                  transition: 'background 0.15s ease',
                  fontSize: '0.875rem',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontWeight: 500, color: '#93c5fd' }}>{order.id}</span>
                <span>{order.customer}</span>
                <span>
                  <span className={`status-badge ${STATUS_CLASS[order.status] ?? ''}`}>
                    {order.status}
                  </span>
                  {isStale && (
                    <span
                      title="Stale data"
                      style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#f59e0b' }}
                    >
                      ⚠
                    </span>
                  )}
                </span>
                <span>{order.items}</span>
                <span>${order.total}</span>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
