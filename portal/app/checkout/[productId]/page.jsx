// Checkout entry — requires login, then creates a Stripe session and redirects.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StartCheckoutButton from './StartCheckoutButton';
import { formatPrice } from '@/lib/stripe';

export default async function CheckoutPage({ params }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/checkout/${params.productId}`);
  }

  const { data: product, error } = await supabase
    .from('products')
    .select('id, type, name, description, price_cents, active')
    .eq('id', params.productId)
    .single();

  if (error || !product || !product.active) {
    return (
      <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)', maxWidth: 640 }}>
        <h1>Product not available</h1>
        <p className="muted">This product was removed or is no longer for sale.</p>
        <a href="/" className="btn btn-ghost">Back to shop</a>
      </div>
    );
  }

  // Already own it?
  const { data: existing } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', product.id)
    .maybeSingle();

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)', maxWidth: 640 }}>
      <p className="eyebrow">Reviewing your order</p>
      <h1>{product.name}</h1>
      <p className="lead">{product.description}</p>

      <div className="card" style={{ marginTop: 'var(--sp-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-4)' }}>
          <span className="muted">Total</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--pine-deep)' }}>
            {formatPrice(product.price_cents)}
          </span>
        </div>

        {existing ? (
          <>
            <p className="form-success">You already own this — head to your library to access it.</p>
            <a href="/account/library" className="btn btn-primary btn-block">Go to my library →</a>
          </>
        ) : (
          <>
            <StartCheckoutButton productId={product.id} />
            <p className="muted" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: 'var(--sp-3)' }}>
              You'll be sent to Stripe's secure payment page. We never see your card details.
            </p>
          </>
        )}
      </div>

      <p style={{ marginTop: 'var(--sp-5)' }}>
        <a href="/" className="muted">← Keep shopping</a>
      </p>
    </div>
  );
}
