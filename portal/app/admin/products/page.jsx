// Admin products — list, create, edit, archive.
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/stripe';
import { createProduct, updateProductActive } from './actions';

export const dynamic = 'force-dynamic';

const TYPES = ['worksheet', 'webinar', 'course'];

export default async function AdminProductsPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="container" style={{ padding: 'var(--sp-7) var(--sp-5)' }}>
      <p className="eyebrow">Products</p>
      <h1>Manage what's in the shop.</h1>

      <details style={{ marginTop: 'var(--sp-5)', marginBottom: 'var(--sp-7)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--pine-deep)', padding: 'var(--sp-3) 0' }}>+ Add a new product</summary>

        <form action={createProduct} className="card" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="type">Type</label>
              <select id="type" name="type" required defaultValue="worksheet">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="price">Price (USD)</label>
              <input id="price" name="price" type="number" min="0" step="0.01" required placeholder="49.00" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" required placeholder="Hiring Decision Framework" />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" placeholder="What the customer gets…" />
          </div>
          <div className="field">
            <label htmlFor="delivery_url">Delivery URL <span className="muted">(optional — link to PDF, video, or course)</span></label>
            <input id="delivery_url" name="delivery_url" type="url" placeholder="https://drive.google.com/file/…" />
          </div>
          <button type="submit" className="btn btn-primary">Create product</button>
        </form>
      </details>

      {(!products || products.length === 0) ? (
        <div className="empty">No products yet — create your first one above.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Type</th>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td><span className="badge badge-muted">{p.type}</span></td>
                <td><strong>{p.name}</strong>{p.description && <div className="muted" style={{ fontSize: '0.85rem' }}>{p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}</div>}</td>
                <td>{formatPrice(p.price_cents)}</td>
                <td>{p.active ? <span className="badge badge-success">active</span> : <span className="badge badge-muted">archived</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  <form action={updateProductActive} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={p.active ? 'false' : 'true'} />
                    <button type="submit" className="btn btn-ghost btn-small">{p.active ? 'Archive' : 'Reactivate'}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
