// Admin orders — full list with status filter + email search.
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({ searchParams }) {
  const supabase = createClient();
  const status = searchParams?.status || '';
  const search = searchParams?.q || '';

  let q = supabase
    .from('orders')
    .select('id, total_cents, status, paid_at, created_at, customer_email, stripe_session_id, order_items(product_name_snapshot, product_type_snapshot)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status && ['pending', 'paid', 'refunded', 'failed'].includes(status)) {
    q = q.eq('status', status);
  }
  if (search) {
    q = q.ilike('customer_email', `%${search}%`);
  }

  const { data: orders, error } = await q;

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      <p className="eyebrow">Orders</p>
      <h1>Every transaction in the studio.</h1>

      <form
        method="GET"
        style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', alignItems: 'flex-end' }}
      >
        <div className="field" style={{ marginBottom: 0, flex: '1 1 240px' }}>
          <label htmlFor="q">Search customer email</label>
          <input id="q" name="q" type="search" defaultValue={search} placeholder="someone@example.com" />
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: 180 }}>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Filter</button>
        <a className="btn btn-ghost" href="/admin/orders">Reset</a>
      </form>

      {error && <div className="form-error">{error.message}</div>}

      {(!orders || orders.length === 0) ? (
        <div className="empty">No orders match this filter.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.paid_at || o.created_at).toLocaleString()}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{o.id.slice(0, 8)}</td>
                <td>{o.customer_email || <span className="muted">—</span>}</td>
                <td>
                  {(o.order_items || []).map((it, i) => (
                    <div key={i}>{it.product_name_snapshot} <span className="muted" style={{ fontSize: '0.8rem' }}>· {it.product_type_snapshot}</span></div>
                  ))}
                </td>
                <td><StatusBadge status={o.status} /></td>
                <td style={{ textAlign: 'right' }}>{formatPrice(o.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted" style={{ marginTop: 'var(--sp-4)', fontSize: '0.85rem' }}>
        Showing up to 200 most-recent matches. Need date-range or larger exports? Open an issue and I'll add it.
      </p>
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
