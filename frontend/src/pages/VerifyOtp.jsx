import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Flame, MailCheck, RotateCw } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const LEN = 6;

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || new URLSearchParams(location.search).get('email') || '';
  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  // No email in context → nothing to verify; send them back to register.
  useEffect(() => { if (!email) navigate('/register', { replace: true }); }, [email, navigate]);

  // Resend cooldown timer.
  useEffect(() => {
    if (!cooldown) return undefined;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const code = digits.join('');

  const submit = useCallback(async (value) => {
    const finalCode = value || code;
    if (finalCode.length !== LEN) return;
    setLoading(true);
    try {
      const user = await verifyOtp(email, finalCode);
      toast.success(`Welcome, ${user.firstName}! Your email is verified.`);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
      setDigits(Array(LEN).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [code, email, verifyOtp, navigate]);

  const onChange = (i, v) => {
    const d = v.replace(/\D/g, '');
    if (!d) { const next = [...digits]; next[i] = ''; setDigits(next); return; }
    const next = [...digits];
    next[i] = d[d.length - 1];
    setDigits(next);
    if (i < LEN - 1) refs.current[i + 1]?.focus();
    if (next.every((x) => x) && next.join('').length === LEN) submit(next.join(''));
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, LEN);
    if (!text) return;
    const next = Array(LEN).fill('');
    text.split('').forEach((c, idx) => { next[idx] = c; });
    setDigits(next);
    if (text.length === LEN) submit(text);
    else refs.current[text.length]?.focus();
  };

  const resend = async () => {
    if (cooldown) return;
    try {
      const res = await resendOtp(email);
      toast.success('A new code has been sent to your email.');
      setCooldown(30);
      if (res?.devOtp) toast(`Dev code: ${res.devOtp}`, { icon: '🔑' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-fire-500 to-fire-700 text-white"><Flame size={22} /></div>
          <p className="text-lg font-extrabold text-white">TZW FireSafe</p>
        </div>

        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fire-500/20 to-amber-400/20 text-amber-300 ring-1 ring-white/10">
          <MailCheck size={26} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Verify your email</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Enter the 6-digit code</h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          We sent a verification code to{' '}
          <span className="font-semibold text-white">{email}</span>. Enter it below to activate your account.
        </p>

        <div className="mt-7 flex justify-between gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className="h-14 w-12 rounded-xl border border-white/15 bg-white/[0.06] text-center text-2xl font-bold text-white shadow-inner outline-none transition focus:border-amber-300/60 focus:bg-white/[0.1] focus:ring-4 focus:ring-amber-400/15"
            />
          ))}
        </div>

        <Button onClick={() => submit()} loading={loading} icon={ShieldCheck} disabled={code.length !== LEN} className="mt-6 w-full">
          Verify & continue
        </Button>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-white/55">
          Didn’t get the code?
          <button onClick={resend} disabled={!!cooldown} className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 disabled:cursor-not-allowed disabled:text-white/30">
            <RotateCw size={13} /> {cooldown ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/65">
          Wrong email?{' '}
          <Link to="/register" className="font-semibold text-amber-300 hover:text-amber-200">Start over</Link>
        </p>
      </div>
    </AuthShell>
  );
}
