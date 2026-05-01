import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata = { title: 'Reset password · Hello Studio' };

export default function ForgotPasswordPage() {
  return (
    <div className="auth-shell">
      <div style={{ width: '100%', maxWidth: 460 }}>
        <h1>Reset your password.</h1>
        <p className="subhead">Enter the email on your account and we'll send a reset link.</p>
        <ForgotPasswordForm />
        <p className="alt">
          Remembered it? <a href="/login">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
