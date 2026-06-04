import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, Check, Flame } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const rules = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH = [
  { label: 'Very weak', color: 'bg-fire-500', text: 'text-fire-300', w: '20%' },
  { label: 'Weak', color: 'bg-fire-400', text: 'text-fire-300', w: '40%' },
  { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-200', w: '60%' },
  { label: 'Good', color: 'bg-lime-400', text: 'text-lime-200', w: '80%' },
  { label: 'Strong', color: 'bg-emerald-400', text: 'text-emerald-200', w: '100%' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', termsAccepted: false });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const passed = useMemo(() => rules.filter((r) => r.test(form.password)).length, [form.password]);
  const strength = form.password ? STRENGTH[Math.min(passed - 1, 4)] || STRENGTH[0] : null;

  const validate = () => {
    const e = {};
    if (!form.firstName) e.firstName = 'Required';
    if (!form.lastName) e.lastName = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (passed < rules.length) e.password = 'Password does not meet all requirements';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    if (!form.termsAccepted) e.termsAccepted = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        password: form.password, confirmPassword: form.confirm, termsAccepted: form.termsAccepted,
      });
      toast.success('We sent a verification code to your email.');
      // Go to the OTP step — verification completes the signup and logs the user in.
      navigate('/verify-otp', { state: { email: form.email, devOtp: res?.devOtp } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-fire-500 to-fire-700 text-white">
            <Flame size={22} />
          </div>
          <p className="text-lg font-extrabold text-white">TZW FireSafe</p>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Client portal</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Create your account</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">Sign up as a client to manage your fire-safety equipment.</p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName}>
              <input className="auth-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input className="auth-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
          </div>
          <Field label="Email" error={errors.email}>
            <input type="email" className="auth-input" placeholder="you@company.rw" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input type={show ? 'text' : 'password'} className="auth-input pr-11" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {form.password && (
            <div className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.w }} />
                </div>
                <span className={`text-xs font-bold ${strength.text}`}>{strength.label}</span>
              </div>
              <p className="mb-2.5 mt-3 text-[11px] font-bold uppercase tracking-wide text-white/75">Password must include</p>
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

          <Field label="Confirm password" error={errors.confirm}>
            <input type={show ? 'text' : 'password'} className="auth-input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>

          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${errors.termsAccepted ? 'border-fire-400/50 bg-fire-500/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20'}`}>
            <input type="checkbox" checked={form.termsAccepted} onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-fire-500 focus:ring-fire-500" />
            <span className="leading-5 text-white/75">
              I agree to the terms of service and privacy policy.
              {errors.termsAccepted && <span className="mt-1 block text-xs font-semibold text-fire-300">{errors.termsAccepted}</span>}
            </span>
          </label>

          <Button type="submit" loading={loading} icon={UserPlus} className="w-full">Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/65">
          Already have access?{' '}
          <Link to="/login" className="font-semibold text-amber-300 hover:text-amber-200">Sign in</Link>
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
