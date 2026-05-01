// Library — shows everything the user has been entitled to.
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Library · Hello Studio' };

const TYPE_LABEL = { worksheet: 'Worksheet', webinar: 'Webinar', course: 'Course' };

export default async function LibraryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from('entitlements')
    .select('id, granted_at, products (id, type, name, description, delivery_url)')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false });

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      <p className="eyebrow">Your library</p>
      <h1>Everything you've unlocked.</h1>
      <p className="lead">Yours forever — re-download or revisit anytime.</p>

      {(!items || items.length === 0) ? (
        <div className="empty" style={{ marginTop: 'var(--sp-6)' }}>
          <p>Your library is empty so far.</p>
          <p>
            <Link href="/" className="btn btn-gold btn-small">Browse the shop →</Link>
          </p>
        </div>
      ) : (
        <div className="product-grid" style={{ marginTop: 'var(--sp-6)' }}>
          {items.map((it) => {
            const p = it.products;
            if (!p) return null;
            return (
              <article key={it.id} className="card product-card">
                <span className="pc-type">{TYPE_LABEL[p.type] || p.type}</span>
                <h3 className="pc-title">{p.name}</h3>
                <p className="pc-desc">{p.description}</p>
                <div className="pc-foot">
                  <span className="muted" style={{ fontSize: '0.85rem' }}>
                    Unlocked {new Date(it.granted_at).toLocaleDateString()}
                  </span>
                  {p.delivery_url ? (
                    <a href={p.delivery_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-small">
                      {p.type === 'worksheet' ? 'Download' : 'Open'}
                    </a>
                  ) : (
                    <span className="muted" style={{ fontSize: '0.85rem' }}>Coming soon</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
