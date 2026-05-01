'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Sent! Check your email for a link to reset your password.");
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      {error && <div className="form-error">{error}</div>}
      {info && <div className="form-success">{info}</div>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
