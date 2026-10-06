import React from 'react';
import { type Order } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { usePermissions, type Role } from '../../lib/permissions';

interface OrderDetailProps {
  order: Order;
  role: Role;
  onAction: (id: string, status: 'Packed' | 'Held' | 'Cancelled') => void;
  isPending: boolean;
  error: string | null;
}

// Status transition machine — valid "from → to" moves only
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Pending:    ['Processing'],
  Processing: ['Packed', 'Held', 'Cancelled'],
  Packed:     ['Shipped', 'Held', 'Cancelled'],
  Shipped:    ['Delivered'],
  Delivered:  [],
  Held:       ['Processing', 'Cancelled'],
  Cancelled:  [],
};

export function OrderDetail({ order, role, onAction, isPending, error }: OrderDetailProps) {
  const perms = usePermissions(role);
  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];

  const timeline = [
    { label: 'Created', time: new Date(order.createdAt).toLocaleString() },
    { label: order.status, time: 'Current', active: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Order Summary */}
      <section>
        <h3 style={{ marginBottom: '0.75rem', color: '#60a5fa' }}>Order Summary</h3>
        <table style={{ width: '100%', fontSize: '0.875rem' }}>
          <tbody>
            {[
              ['Order ID', order.id],
              ['Customer', order.customer],
              ['Items', order.items],
              ['Total', `$${order.total}`],
              ['Status', order.status],
            ].map(([label, value]) => (
              <tr key={label as string}>
                <td style={{ color: '#94a3b8', padding: '0.3rem 0', width: '40%' }}>{label}</td>
                <td style={{ fontWeight: 500, padding: '0.3rem 0' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Status Timeline */}
      <section>
        <h3 style={{ marginBottom: '0.75rem', color: '#60a5fa' }}>Status Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {timeline.map((step) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: step.active ? '#3b82f6' : '#374151',
                flexShrink: 0,
              }} />
              <div>
                <span style={{ fontWeight: step.active ? 700 : 400 }}>{step.label}</span>
                <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                  {step.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions — driven by permission layer */}
      {allowed.length > 0 && (
        <section>
          <h3 style={{ marginBottom: '0.75rem', color: '#60a5fa' }}>Actions</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {allowed.includes('Packed') && perms.canMarkPacked && (
              <Button
                variant="primary"
                onClick={() => onAction(order.id, 'Packed')}
                disabled={isPending}
                aria-label="Mark order as packed"
              >
                Mark Packed
              </Button>
            )}
            {allowed.includes('Held') && perms.canHoldOrder && (
              <Button
                variant="warning"
                onClick={() => onAction(order.id, 'Held')}
                disabled={isPending}
                aria-label="Hold this order"
              >
                Hold Order
              </Button>
            )}
            {allowed.includes('Cancelled') && perms.canCancelOrder && (
              <Button
                variant="danger"
                onClick={() => onAction(order.id, 'Cancelled')}
                disabled={isPending}
                aria-label="Cancel this order"
              >
                Cancel Order
              </Button>
            )}
          </div>
          {isPending && (
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Updating…
            </p>
          )}
          {error && (
            <p role="alert" style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              ⚠ {error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
