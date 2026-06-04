import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';
import { authApi } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const submit = async (ev) => {
    ev.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      setSent(true);
      setDevResetUrl(result?.resetUrl || '');
      toast.success('Reset instructions sent.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/65 hover:text-amber-200">
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fire-500 to-fire-700 text-white shadow-[0_16px_40px_-12px_rgba(220,38,38,0.8)]">
          <Mail size={22} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Password recovery</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Reset your password</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">Enter your account email and we will send a secure reset link.</p>

        {sent ? (
          <div className="mt-7 space-y-4">
            <div className="rounded-2xl border border-safe-400/25 bg-safe-500/10 p-4 text-sm leading-6 text-white/70">
              If an account exists for that email, reset instructions have been sent. The link expires in 15 minutes.
            </div>
            {devResetUrl && (
              <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
                Development reset link: <Link className="font-bold underline" to={new URL(devResetUrl).pathname + new URL(devResetUrl).search}>open reset screen</Link>
              </div>
            )}
            <Button as="button" variant="secondary" className="w-full" onClick={() => { setSent(false); setEmail(''); setDevResetUrl(''); }}>
              Send another link
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Field label="Email" error={error}>
              <input
                type="email"
                autoComplete="email"
                className="auth-input"
                placeholder="you@tzw.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button type="submit" loading={loading} icon={Send} className="w-full">Send reset link</Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-white/70">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-fire-300">{error}</p>}
    </div>
  );
}
