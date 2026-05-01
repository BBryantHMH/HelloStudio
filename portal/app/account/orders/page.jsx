// Full purchase history.
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Orders · Hello Studio' };

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_cents, status, paid_at, created_at, order_items(product_name_snapshot, product_type_snapshot, price_cents)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      <p className="eyebrow">Order history</p>
      <h1>All of your orders.</h1>

      {(!orders || orders.length === 0) ? (
        <div className="empty" style={{ marginTop: 'var(--sp-6)' }}>
          No orders yet.
        </div>
      ) : (
        <table className="data-table" style={{ marginTop: 'var(--sp-5)' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Order #</th>
              <th>Items</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.paid_at || o.created_at).toLocaleDateString()}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{o.id.slice(0, 8)}</td>
                <td>
                  {(o.order_items || []).map((it, i) => (
                    <div key={i}>{it.product_name_snapshot} <span className="muted" style={{ fontSize: '0.82rem' }}>· {it.product_type_snapshot}</span></div>
                  ))}
                </td>
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

function StatusBadge({ status }) {
  const cls = status === 'paid' ? 'badge badge-success'
    : status === 'refunded' ? 'badge badge-muted'
    : status === 'failed' ? 'badge badge-error'
    : 'badge badge-warning';
  return <span className={cls}>{status}</span>;
}
