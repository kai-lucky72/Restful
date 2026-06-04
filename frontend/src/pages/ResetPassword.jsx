import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, Eye, EyeOff, KeyRound } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';
import { authApi } from '../api';

const rules = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const passed = useMemo(() => rules.filter((r) => r.test(form.password)).length, [form.password]);

  const validate = () => {
    const next = {};
    if (!token) next.token = 'Reset token is missing. Please request a new link.';
    if (passed < rules.length) next.password = 'Password does not meet all requirements';
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      toast.success('Password reset. Please sign in.');
      navigate('/login');
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
          <KeyRound size={22} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Create new password</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Choose a secure password</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">Your new password must meet all security requirements.</p>

        {errors.token && <div className="mt-5 rounded-2xl border border-fire-400/30 bg-fire-500/10 p-4 text-sm text-fire-200">{errors.token}</div>}

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <Field label="New password" error={errors.password}>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                className="auth-input pr-11"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {form.password && (
            <div className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-white/75">Password must include</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {rules.map((r) => {
                  const ok = r.test(form.password);
                  return (
                    <div key={r.label} className={`flex items-center gap-2 text-[13px] font-medium ${ok ? 'text-emerald-300' : 'text-white/70'}`}>
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition ${ok ? 'bg-emerald-400 text-[#0a0e17]' : 'ring-1 ring-white/30'}`}>
                        {ok ? <Check size={11} strokeWidth={3} /> : <span className="h-1 w-1 rounded-full bg-white/40" />}
                      </span>
                      {r.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Field label="Confirm new password" error={errors.confirm}>
            <input
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              className="auth-input"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </Field>

          <Button type="submit" loading={loading} icon={KeyRound} className="w-full">Reset password</Button>
        </form>
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
