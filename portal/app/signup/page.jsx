import SignupForm from './SignupForm';

export const metadata = { title: 'Create account · Hello Studio' };

export default function SignupPage() {
  return (
    <div className="auth-shell">
      <div style={{ width: '100%', maxWidth: 460 }}>
        <h1>Create your account.</h1>
        <p className="subhead">One account, all your Hello Studio purchases in one place.</p>
        <SignupForm />
        <p className="alt">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
