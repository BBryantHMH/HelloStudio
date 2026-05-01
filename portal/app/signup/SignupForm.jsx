'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is OFF in Supabase settings, we get a session immediately.
    if (data?.session) {
      router.push('/account');
      router.refresh();
    } else {
      // Email confirmation is ON — they need to click the link.
      setInfo("Account created! Check your email for a confirmation link, then come back to sign in.");
    }
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      {error && <div className="form-error">{error}</div>}
      {info && <div className="form-success">{info}</div>}
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="password">Password (8+ characters)</label>
        <input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
