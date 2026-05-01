// Creates a Stripe Checkout Session for a single product and returns its URL.
// The user's browser is redirected to that URL by the client.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request) {
  try {
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to check out.' }, { status: 401 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, description, price_cents, stripe_price_id, active')
      .eq('id', productId)
      .single();

    if (error || !product || !product.active) {
      return NextResponse.json({ error: 'Product not available.' }, { status: 404 });
    }

    // Already entitled? Don't allow double-buying.
    const { data: existing } = await supabase
      .from('entitlements')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You already own this.' }, { status: 409 });
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Use the persisted Stripe price if it exists, otherwise create an inline price_data
    // (handy when admin hasn't synced the product to Stripe yet).
    const lineItems = product.stripe_price_id
      ? [{ price: product.stripe_price_id, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            unit_amount: product.price_cents,
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: user.email,
      success_url: `${siteUrl}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/${product.id}`,
      metadata: {
        user_id: user.id,
        product_id: product.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('checkout error', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
