// Admin section layout — gates access by role and provides a sub-nav.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)', maxWidth: 600 }}>
        <h1>Not authorized</h1>
        <p className="lead">Your account doesn't have admin access.</p>
        <p className="muted">If you should have admin access, run this in Supabase SQL Editor (replace the email):</p>
        <pre style={{ background: 'var(--cream-deep)', padding: 'var(--sp-4)', borderRadius: 'var(--r-md)', fontSize: '0.85rem', overflow: 'auto' }}>
{`update public.profiles set role = 'admin' where email = '${user.email}';`}
        </pre>
        <Link href="/account" className="btn btn-ghost">Back to my account</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: 'var(--pine-deep)', color: 'var(--cream)', padding: 'var(--sp-3) var(--sp-5)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)', padding: 0 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-soft)' }}>Admin</span>
          <Link href="/admin" style={{ color: 'var(--cream)' }}>Overview</Link>
          <Link href="/admin/orders" style={{ color: 'var(--cream)' }}>Orders</Link>
          <Link href="/admin/customers" style={{ color: 'var(--cream)' }}>Customers</Link>
          <Link href="/admin/products" style={{ color: 'var(--cream)' }}>Products</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
