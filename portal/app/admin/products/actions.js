'use server';
// Server actions for the admin products page.
// These run on the server with the user's session — RLS enforces admin-only access.

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') throw new Error('Admin only.');
  return supabase;
}

export async function createProduct(formData) {
  const supabase = await requireAdmin();

  const type = String(formData.get('type') || '');
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const delivery_url = String(formData.get('delivery_url') || '').trim() || null;
  const priceUsd = parseFloat(String(formData.get('price') || '0'));

  if (!['worksheet','webinar','course'].includes(type)) throw new Error('Invalid type');
  if (!name) throw new Error('Name is required');
  if (!Number.isFinite(priceUsd) || priceUsd < 0) throw new Error('Price must be ≥ 0');

  const price_cents = Math.round(priceUsd * 100);

  const { error } = await supabase
    .from('products')
    .insert({ type, name, description, delivery_url, price_cents, active: true });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/products');
  revalidatePath('/');
}

export async function updateProductActive(formData) {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') || '');
  const active = String(formData.get('active') || 'true') === 'true';
  if (!id) throw new Error('Missing product id');

  const { error } = await supabase
    .from('products')
    .update({ active })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/products');
  revalidatePath('/');
}
