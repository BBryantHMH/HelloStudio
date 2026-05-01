// Admin customers — list of all customer profiles with totals.
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage({ searchParams }) {
  const supabase = createClient();
  const search = searchParams?.q || '';

  let q = supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (search) {
    q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: profiles } = await q;

  // Pull spend per customer from orders (paid status only) — single query, JS-side rollup
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('user_id, total_cents, paid_at, status')
    .eq('status', 'paid');

  const spendByUser = new Map();
  const lastOrderByUser = new Map();
  for (const o of paidOrders || []) {
    spendByUser.set(o.user_id, (spendByUser.get(o.user_id) || 0) + (o.total_cents || 0));
    const cur = lastOrderByUser.get(o.user_id);
    if (!cur || new Date(o.paid_at) > new Date(cur)) lastOrderByUser.set(o.user_id, o.paid_at);
  }

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      <p className="eyebrow">Customers</p>
      <h1>Everyone in your studio.</h1>

      <form method="GET" style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)', alignItems: 'flex-end' }}>
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={search} placeholder="email or name" />
        </div>
        <button className="btn btn-primary" type="submit">Search</button>
        <a className="btn btn-ghost" href="/admin/customers">Reset</a>
      </form>

      {(!profiles || profiles.length === 0) ? (
        <div className="empty">No customers match.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Joined</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last order</th>
              <th style={{ textAlign: 'right' }}>Lifetime spend</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>{p.full_name || <span className="muted">—</span>}</td>
                <td>{p.email}</td>
                <td>{p.role === 'admin' ? <span className="badge badge-warning">admin</span> : <span className="muted">customer</span>}</td>
                <td>{lastOrderByUser.get(p.id) ? new Date(lastOrderByUser.get(p.id)).toLocaleDateString() : <span className="muted">—</span>}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatPrice(spendByUser.get(p.id) || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted" style={{ marginTop: 'var(--sp-4)', fontSize: '0.85rem' }}>Showing up to 500 customers.</p>
    </div>
  );
}
