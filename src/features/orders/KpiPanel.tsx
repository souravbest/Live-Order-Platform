import { useMemo, useState } from 'react';
import type { Order } from '../../lib/api';

interface KpiPanelProps {
  orders: Order[];
  showSlaBreachRate: boolean;
  showSupervisorWidget: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Shipped:    '#d8b4fe',
  Packed:     '#86efac',
  Held:       '#fca5a5',
  Processing: '#93c5fd',
  Delivered:  '#6ee7b7',
  Pending:    '#fde047',
  Cancelled:  '#f87171',
};

const STATUS_ORDER = ['Shipped', 'Packed', 'Held', 'Processing', 'Delivered', 'Pending', 'Cancelled'];

function DonutChart({
  segments,
  total,
  hovered,
  onHover,
}: {
  segments: { status: string; count: number; color: string }[];
  total: number;
  hovered: string | null;
  onHover: (s: string | null) => void;
}) {
  const R = 38;
  const CX = 50;
  const CIRC = 2 * Math.PI * R;
  const GAP = total > 0 ? Math.min(1.5, CIRC / Math.max(segments.length, 1) / 6) : 0;

  let cursor = -0.25 * CIRC;

  const arcs = segments.map(({ status, count, color }) => {
    const slice = total > 0 ? (count / total) * CIRC : 0;
    const dashArray = Math.max(0, slice - GAP);
    const offset = -cursor;
    cursor += slice;
    return { status, count, color, dashArray, offset };
  });

  const hoveredArc = arcs.find(a => a.status === hovered);

  return (
    <svg width={100} height={100} viewBox="0 0 100 100" aria-label="Status distribution donut chart" role="img">
      <circle cx={CX} cy={CX} r={R} fill="none" stroke="#1f2937" strokeWidth={11} />
      {arcs.map(({ status, color, dashArray, offset, count }) => {
        const isHov = hovered === status;
        const isDim = hovered !== null && !isHov;
        return (
          <circle
            key={status}
            cx={CX} cy={CX} r={R}
            fill="none"
            stroke={color}
            strokeWidth={isHov ? 14 : 10}
            strokeDasharray={`${dashArray} ${CIRC}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              opacity: isDim ? 0.2 : 1,
              transition: 'stroke-width 0.2s ease, opacity 0.2s ease, stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)',
              cursor: 'pointer',
              filter: isHov ? `drop-shadow(0 0 5px ${color}99)` : 'none',
            }}
            onMouseEnter={() => onHover(status)}
            onMouseLeave={() => onHover(null)}
            aria-label={`${status}: ${count}`}
          />
        );
      })}
      <text x={CX} y={CX - 4} textAnchor="middle" fontSize={7.5} fill="#94a3b8" style={{ userSelect: 'none' }}>
        {hovered ?? 'Total'}
      </text>
      <text x={CX} y={CX + 9} textAnchor="middle" fontSize={12} fontWeight={700} fill="#f8fafc" style={{ userSelect: 'none' }}>
        {hovered
          ? (hoveredArc?.count ?? 0).toLocaleString()
          : total.toLocaleString()}
      </text>
    </svg>
  );
}

export function KpiPanel({ orders, showSlaBreachRate, showSupervisorWidget }: KpiPanelProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }
    const held = byStatus['Held'] ?? 0;
    const total = orders.length;
    const slaBreachRate = total > 0 ? ((held / total) * 100).toFixed(1) : '0.0';
    const processing = byStatus['Processing'] ?? 0;
    return { byStatus, total, held, slaBreachRate, processing };
  }, [orders]);

  const segments = useMemo(
    () =>
      STATUS_ORDER
        .filter(s => (stats.byStatus[s] ?? 0) > 0)
        .map(s => ({ status: s, count: stats.byStatus[s]!, color: STATUS_COLORS[s] ?? '#6b7280' })),
    [stats.byStatus],
  );

  return (
    <div className="kpi-panel">
      <div className="kpi-card">
        <span className="kpi-label">Total Orders</span>
        <span className="kpi-value">{stats.total.toLocaleString()}</span>
      </div>

      <div className="kpi-card" style={{ borderColor: '#3b82f6' }}>
        <span className="kpi-label">Processing</span>
        <span className="kpi-value" style={{ color: '#60a5fa' }}>
          {stats.processing.toLocaleString()}
        </span>
      </div>

      {showSlaBreachRate && (
        <div className="kpi-card" style={{ borderColor: '#ef4444' }}>
          <span className="kpi-label">SLA Breach Rate</span>
          <span className="kpi-value" style={{ color: '#f87171' }}>{stats.slaBreachRate}%</span>
        </div>
      )}

      {/* Status Breakdown — interactive animated donut chart */}
      <div className="kpi-card" style={{ flex: 2 }}>
        <span className="kpi-label" style={{ marginBottom: '0.25rem', display: 'block' }}>
          Status Breakdown
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <DonutChart
            segments={segments}
            total={stats.total}
            hovered={hovered}
            onHover={setHovered}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
            {segments.map(({ status, count, color }) => (
              <div
                key={status}
                className="chart-legend-item"
                onMouseEnter={() => setHovered(status)}
                onMouseLeave={() => setHovered(null)}
                style={{ opacity: hovered && hovered !== status ? 0.35 : 1, transition: 'opacity 0.2s' }}
              >
                <span className="chart-legend-dot" style={{ background: color }} />
                <span style={{ flex: 1 }}>{status}</span>
                <span style={{ color, fontWeight: 600, fontSize: '0.72rem' }}>
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supervisor widget — inline, not a separate row */}
      {showSupervisorWidget && (
        <div className="kpi-card" style={{ borderColor: '#7c3aed', maxWidth: 200, justifyContent: 'center' }}>
          <span className="kpi-label" style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            🛡 Supervisor
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Hold, cancel &amp; SLA breaches visible
          </span>
        </div>
      )}
    </div>
  );
}

