import { describe, it, expect } from 'vitest';
import { applyGridFilters, type GridState } from '../features/orders/useGridState';
import type { Order } from '../lib/api';

const mockOrders: Order[] = [
  { id: 'ORD-000001', customer: 'Alice Smith',  status: 'Pending',    items: 2, total: '49.99',  createdAt: '2024-01-01T10:00:00Z' },
  { id: 'ORD-000002', customer: 'Bob Jones',    status: 'Processing', items: 5, total: '129.50', createdAt: '2024-01-02T11:00:00Z' },
  { id: 'ORD-000003', customer: 'Carol Green',  status: 'Held',       items: 1, total: '19.99',  createdAt: '2024-01-03T12:00:00Z' },
  { id: 'ORD-000004', customer: 'Dave Black',   status: 'Cancelled',  items: 3, total: '75.00',  createdAt: '2024-01-04T13:00:00Z' },
];

const baseState: GridState = {
  search: '',
  statusFilter: '',
  sortField: 'createdAt',
  sortDir: 'asc',
  selectedId: null,
};

describe('applyGridFilters', () => {
  it('returns all orders when no filters applied', () => {
    const result = applyGridFilters(mockOrders, baseState);
    expect(result).toHaveLength(4);
  });

  it('filters by search term (id)', () => {
    const result = applyGridFilters(mockOrders, { ...baseState, search: 'ORD-000002' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ORD-000002');
  });

  it('filters by search term (customer name)', () => {
    const result = applyGridFilters(mockOrders, { ...baseState, search: 'carol' });
    expect(result).toHaveLength(1);
    expect(result[0].customer).toBe('Carol Green');
  });

  it('filters by status', () => {
    const result = applyGridFilters(mockOrders, { ...baseState, statusFilter: 'Held' });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Held');
  });

  it('sorts by total descending', () => {
    const result = applyGridFilters(mockOrders, { ...baseState, sortField: 'total', sortDir: 'desc' });
    expect(result[0].total).toBe('75.00');
  });

  it('returns empty array when no matches', () => {
    const result = applyGridFilters(mockOrders, { ...baseState, search: 'xyz-not-found' });
    expect(result).toHaveLength(0);
  });
});
