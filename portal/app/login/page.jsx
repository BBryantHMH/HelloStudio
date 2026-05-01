import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in · Hello Studio' };

export default function LoginPage({ searchParams }) {
  return (
    <div className="auth-shell">
      <div style={{ width: '100%', maxWidth: 460 }}>
        <h1>Welcome back.</h1>
        <p className="subhead">Sign in to access your library, courses, and orders.</p>
        <LoginForm next={searchParams?.next} />
        <p className="alt">
          New here? <a href="/signup">Create an account</a> &nbsp;·&nbsp; <a href="/forgot-password">Forgot password?</a>
        </p>
      </div>
    </div>
  );
}
