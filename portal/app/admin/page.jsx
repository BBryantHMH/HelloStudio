// Admin overview — KPI tiles + recent activity.
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/stripe';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const supabase = createClient();

  // Pull KPIs in parallel
  const [kpisRes, recentOrdersRes] = await Promise.all([
    supabase.from('admin_kpis').select('*').single(),
    supabase
      .from('orders')
      .select('id, total_cents, status, paid_at, created_at, customer_email, order_items(product_name_snapshot)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const kpis = kpisRes.data || {};
  const recentOrders = recentOrdersRes.data || [];

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      <p className="eyebrow">Admin overview</p>
      <h1>Studio at a glance.</h1>

      <div className="kpi-grid">
        <Kpi label="Revenue · last 30d" value={formatPrice(kpis.revenue_30d_cents)} sub={`Last 7d: ${formatPrice(kpis.revenue_7d_cents)}`} />
        <Kpi label="Lifetime revenue" value={formatPrice(kpis.lifetime_revenue_cents)} />
        <Kpi label="Paid orders" value={kpis.total_paid_orders ?? 0} sub="all time" />
        <Kpi label="Customers" value={kpis.total_customers ?? 0} sub={`${kpis.new_customers_30d ?? 0} new in 30d`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-4)' }}>
        <h2>Recent orders</h2>
        <Link href="/admin/orders" className="muted">View all →</Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className="empty">No orders yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.paid_at || o.created_at).toLocaleDateString()}</td>
                <td>{o.customer_email || <span className="muted">—</span>}</td>
                <td>{(o.order_items || []).map((it) => it.product_name_snapshot).join(', ')}</td>
                <td><StatusBadge status={o.status} /></td>
                <td style={{ textAlign: 'right' }}>{formatPrice(o.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === 'paid' ? 'badge badge-success'
    : status === 'refunded' ? 'badge badge-muted'
    : status === 'failed' ? 'badge badge-error'
    : 'badge badge-warning';
  return <span className={cls}>{status}</span>;
}
