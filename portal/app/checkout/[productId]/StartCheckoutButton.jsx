'use client';
import { useState } from 'react';

export default function StartCheckoutButton({ productId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function go() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data?.error || 'Could not start checkout.');
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <>
      {error && <div className="form-error">{error}</div>}
      <button onClick={go} disabled={loading} className="btn btn-primary btn-block">
        {loading ? 'Connecting to Stripe…' : 'Pay with card →'}
      </button>
    </>
  );
}
