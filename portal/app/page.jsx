// Public storefront — anyone can browse products. Buying requires an account.
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/stripe';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TYPE_LABEL = { worksheet: 'Worksheet', webinar: 'Webinar', course: 'Course' };

export default async function StorefrontPage({ searchParams }) {
  const filter = searchParams?.type;
  const supabase = createClient();

  let query = supabase
    .from('products')
    .select('id, type, name, description, price_cents, cover_image_url')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (filter && ['worksheet', 'webinar', 'course'].includes(filter)) {
    query = query.eq('type', filter);
  }

  const { data: products, error } = await query;

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      <header style={{ textAlign: 'center', marginBottom: 'var(--sp-7)' }}>
        <p className="eyebrow">The Studio Shop</p>
        <h1>Workshops, worksheets, and courses for <em className="serif-accent">practice owners.</em></h1>
        <p className="lead" style={{ maxWidth: 640, margin: '0 auto' }}>
          Practical tools and live conversations for group practice owners and the humans who run their day-to-day.
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
        <FilterTab href="/" label="All" active={!filter} />
        <FilterTab href="/?type=course" label="Courses" active={filter === 'course'} />
        <FilterTab href="/?type=webinar" label="Webinars" active={filter === 'webinar'} />
        <FilterTab href="/?type=worksheet" label="Worksheets" active={filter === 'worksheet'} />
      </div>

      {error && <div className="form-error">Couldn't load products: {error.message}</div>}

      {(!products || products.length === 0) ? (
        <div className="empty">
          <p>No products yet.</p>
          <p style={{ fontSize: '0.9rem' }}>
            If you're the admin, head to <a href="/admin/products">/admin/products</a> to create one.
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <article key={p.id} className="card product-card">
              <span className="pc-type">{TYPE_LABEL[p.type] || p.type}</span>
              <h3 className="pc-title">{p.name}</h3>
              <p className="pc-desc">{p.description}</p>
              <div className="pc-foot">
                <span className="pc-price">{formatPrice(p.price_cents)}</span>
                <Link href={`/checkout/${p.id}`} className="btn btn-gold btn-small">Buy now →</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({ href, label, active }) {
  return (
    <a
      href={href}
      style={{
        padding: '8px 18px',
        borderRadius: 'var(--r-pill)',
        background: active ? 'var(--pine-deep)' : 'transparent',
        color: active ? 'var(--cream)' : 'var(--ink-soft)',
        border: active ? 'none' : '1.5px solid var(--line)',
        fontSize: '0.9rem',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {label}
    </a>
  );
}
