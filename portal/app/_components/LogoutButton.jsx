'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'transparent',
        border: 0,
        color: 'var(--muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
      }}
    >
      Sign out
    </button>
  );
}
