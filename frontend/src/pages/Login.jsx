import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Flame } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate('/');
    } catch (err) {
      // Unverified account → send them to the OTP step (a fresh code was emailed).
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        toast('Please verify your email to continue.', { icon: '📧' });
        navigate('/verify-otp', { state: { email: form.email } });
        return;
      }
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="mb-7 flex items-center gap-3 lg:hidden">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-fire-500 to-fire-700 text-white">
            <Flame size={22} />
          </div>
          <p className="text-lg font-extrabold text-white">TZW FireSafe</p>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Secure access</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">Sign in to your fire-safety workspace.</p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <Field label="Email" error={errors.email}>
            <input
              type="email" autoComplete="email"
              className="auth-input"
              placeholder="you@tzw.rw"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'} autoComplete="current-password"
                className="auth-input pr-11"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-semibold text-amber-300 hover:text-amber-200">Forgot password?</Link>
          </div>

          <Button type="submit" loading={loading} icon={LogIn} className="mt-1 w-full">Sign in</Button>
        </form>

        <p className="mt-7 text-center text-sm text-white/65">
          Need access?{' '}
          <Link to="/register" className="font-semibold text-amber-300 hover:text-amber-200">Create a client account</Link>
        </p>
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
