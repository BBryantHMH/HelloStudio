// Stripe webhook — receives checkout.session.completed and fulfills the order.
// Uses the service-role Supabase client to bypass RLS.
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // Stripe SDK needs Node, not Edge.

export async function POST(request) {
  const body = await request.text();
  const sig = headers().get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 });
  }
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await fulfillOrder(stripe, supabase, session);
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      await markRefunded(supabase, charge.payment_intent);
    } else {
      // Other events arrive but we don't act on them yet.
      console.log(`Received unhandled event: ${event.type}`);
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook handler error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function fulfillOrder(stripe, supabase, session) {
  // Idempotency: if we already created an order for this session, stop.
  const { data: alreadyExists } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (alreadyExists) {
    console.log(`Order already fulfilled for session ${session.id}`);
    return;
  }

  const userId = session.metadata?.user_id;
  const productId = session.metadata?.product_id;
  if (!userId || !productId) {
    throw new Error(`Session ${session.id} missing user_id or product_id metadata`);
  }

  // Fetch product details (snapshot into the order so reports survive product edits)
  const { data: product } = await supabase
    .from('products')
    .select('id, type, name, price_cents')
    .eq('id', productId)
    .single();

  if (!product) {
    throw new Error(`Product ${productId} not found at fulfillment time`);
  }

  // Create the order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      status: 'paid',
      total_cents: session.amount_total ?? product.price_cents,
      currency: session.currency || 'usd',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      customer_email: session.customer_details?.email || session.customer_email,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (orderErr) throw orderErr;

  // Create the line item
  const { error: itemErr } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    price_cents: product.price_cents,
    product_name_snapshot: product.name,
    product_type_snapshot: product.type,
  });
  if (itemErr) throw itemErr;

  // Grant entitlement (UPSERT — already-owned is fine)
  const { error: entErr } = await supabase.from('entitlements').upsert(
    { user_id: userId, product_id: product.id, order_id: order.id },
    { onConflict: 'user_id,product_id' }
  );
  if (entErr) throw entErr;

  console.log(`Fulfilled order ${order.id} for user ${userId} (product ${product.id})`);
}

async function markRefunded(supabase, paymentIntentId) {
  if (!paymentIntentId) return;
  const { error } = await supabase
    .from('orders')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', paymentIntentId);
  if (error) throw error;
  // Note: we leave the entitlement in place. If you want to revoke access on refund,
  // delete from public.entitlements where order_id matches.
}
