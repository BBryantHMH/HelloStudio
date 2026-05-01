// Customer overview — landing page after sign-in.
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/stripe';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const justPurchased = searchParams?.success === 'true';

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single();

  // Recent orders (paid only)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_cents, paid_at, created_at, status, order_items(product_name_snapshot, product_type_snapshot, price_cents)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // Entitlement count
  const { count: libraryCount } = await supabase
    .from('entitlements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      {justPurchased && (
        <div className="form-success" style={{ marginBottom: 'var(--sp-5)' }}>
          🎉 Payment successful. Your purchase has been added to your library — give us a minute if it's not there yet.
        </div>
      )}

      <p className="eyebrow">Welcome back</p>
      <h1>Hi, {profile?.full_name || profile?.email}.</h1>
      <p className="lead">Your studio, your pace.</p>

      <div className="kpi-grid" style={{ marginTop: 'var(--sp-6)' }}>
        <div className="kpi">
          <div className="kpi-label">In your library</div>
          <div className="kpi-value">{libraryCount || 0}</div>
          <div className="kpi-sub">items unlocked</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Recent orders</div>
          <div className="kpi-value">{orders?.length || 0}</div>
          <div className="kpi-sub"><Link href="/account/orders">See all →</Link></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', marginTop: 'var(--sp-6)' }}>
        <Link href="/account/library" className="card" style={{ textDecoration: 'none' }}>
          <span className="card-tag">Your library</span>
          <h3>Open what you've already bought</h3>
          <p className="muted">Worksheets, recordings, course access — all in one place.</p>
        </Link>
        <Link href="/" className="card" style={{ textDecoration: 'none' }}>
          <span className="card-tag">Browse the shop</span>
          <h3>What's in the studio this week</h3>
          <p className="muted">New workshops and tools drop here regularly.</p>
        </Link>
      </div>

      <h2 style={{ marginTop: 'var(--sp-7)' }}>Recent orders</h2>
      {(!orders || orders.length === 0) ? (
        <div className="empty">You haven't bought anything yet. <Link href="/">Browse the shop →</Link></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Items</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.paid_at || o.created_at).toLocaleDateString()}</td>
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

function StatusBadge({ status }) {
  const cls = status === 'paid' ? 'badge badge-success'
    : status === 'refunded' ? 'badge badge-muted'
    : status === 'failed' ? 'badge badge-error'
    : 'badge badge-warning';
  return <span className={cls}>{status}</span>;
}
