import './globals.css';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LogoutButton from './_components/LogoutButton';

export const metadata = {
  title: 'Hello Studio Portal',
  description: 'Sign in to access your workshops, worksheets, and courses from Hello Studio.',
};

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role || 'customer';
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="portal-nav">
          <Link href="/" className="brand">Hello <em>Studio</em></Link>
          <nav>
            <Link href="/">Shop</Link>
            {user && <Link href="/account">My Account</Link>}
            {user && <Link href="/account/library">Library</Link>}
            {role === 'admin' && <Link href="/admin">Admin</Link>}
            {!user && <Link href="/login">Sign in</Link>}
            {!user && <Link href="/signup" className="btn btn-gold btn-small">Create account</Link>}
            {user && <LogoutButton />}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
