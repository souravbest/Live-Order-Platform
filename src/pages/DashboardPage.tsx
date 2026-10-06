import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useLiveOrders } from '../features/orders/useLiveOrders';
import { useOrderMutation } from '../features/orders/useOrderMutation';
import { useGridState } from '../features/orders/useGridState';
import { OrdersGrid } from '../features/orders/OrdersGrid';
import { OrderDetail } from '../features/orders/OrderDetail';
import { KpiPanel } from '../features/orders/KpiPanel';
import { Banner } from '../components/ui/Banner';
import { Drawer } from '../components/ui/Drawer';
import { usePermissions, type Role } from '../lib/permissions';
import { ApiError, type Order, type OrderStatus } from '../lib/api';

interface DashboardPageProps {
  role: Role;
  onRoleChange: (r: Role) => void;
}

export default function DashboardPage({ role, onRoleChange }: DashboardPageProps) {
  const perms = usePermissions(role);
  const { orders, isLoading, connectionStatus, liveAnnouncement } = useLiveOrders();
  const { state, setSelectedId } = useGridState();
  const mutation = useOrderMutation();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedOrder: Order | undefined = orders.find((o) => o.id === state.selectedId);

  const handleAction = async (id: string, status: 'Packed' | 'Held' | 'Cancelled') => {
    setMutationError(null);
    setSuccessMsg(null);
    try {
      await mutation.mutateAsync({ id, status: status as OrderStatus });
      setSuccessMsg(`Order ${id} updated to ${status}.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed. Please try again.';
      setMutationError(msg);
    }
  };

  return (
    <div className="app-container">
      {/* aria-live region for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {liveAnnouncement}
      </div>

      {/* Header */}
      <header>
        <h1>
          <Package size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          OrderPulse
          <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: '#6b7280', fontWeight: 400 }}>
            {import.meta.env.VITE_ENV?.toUpperCase()}
          </span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Role switcher */}
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Role:
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as Role)}
              style={{
                background: '#0f1115', border: '1px solid #2e3340',
                color: '#f8fafc', borderRadius: '0.25rem', padding: '0.2rem 0.5rem',
                fontSize: '0.8rem',
              }}
            >
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </label>

          {/* Live connection badge */}
          <div className="live-indicator">
            {connectionStatus === 'connected' && <><div className="pulse" /><span>Live</span></>}
            {connectionStatus === 'reconnecting' && <span style={{ color: '#f59e0b' }}>⟳ Reconnecting…</span>}
            {connectionStatus === 'disconnected' && <span style={{ color: '#ef4444' }}>● Disconnected</span>}
          </div>
        </div>
      </header>

      {/* Connection Banner */}
      {connectionStatus === 'disconnected' && (
        <Banner
          type="error"
          message="Live connection lost. Data may be stale. Attempting to reconnect…"
        />
      )}
      {connectionStatus === 'reconnecting' && (
        <Banner type="warning" message="Reconnecting to live event stream…" />
      )}

      {/* Success / Error banners */}
      {successMsg && (
        <Banner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />
      )}
      {mutationError && (
        <Banner type="error" message={mutationError} onDismiss={() => setMutationError(null)} />
      )}

      <main>
        {/* KPI Panel */}
        {perms.canViewKpiPanel && (
          <KpiPanel
            orders={orders}
            showSlaBreachRate={perms.canViewSlaBreachRate}
            showSupervisorWidget={perms.canViewSupervisorWidget}
          />
        )}


        {/* Orders Grid */}
        {isLoading ? (
          <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading 10,500 orders…</div>
        ) : (
          <OrdersGrid
            orders={orders}
            selectedId={state.selectedId}
            onSelectOrder={setSelectedId}
          />
        )}
      </main>

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedId(null)}
        title={selectedOrder ? `Order ${selectedOrder.id}` : ''}
      >
        {selectedOrder && (
          <OrderDetail
            order={selectedOrder}
            role={role}
            onAction={handleAction}
            isPending={mutation.isPending}
            error={mutationError}
          />
        )}
      </Drawer>
    </div>
  );
}
