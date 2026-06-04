import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { RoleBadge } from '../components/ui/Badge';
import { usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { fullName, initials } from '../lib/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ firstName: user.firstName, lastName: user.lastName });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await usersApi.updateProfile(profile);
      setUser({ ...user, ...updated });
      toast.success('Profile updated.');
    } catch (err) { toast.error(err.message); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match.');
    setSavingPw(true);
    try {
      await usersApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed.');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.message); }
    finally { setSavingPw(false); }
  };

  return (
    <>
      <PageHeader eyebrow="Account center" title="Profile" subtitle="Manage your identity, security settings, and workspace role." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="liquid-card p-6 lg:col-span-1">
          <div className="liquid-inner flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-fire-600 to-amber-500 text-3xl font-black text-white shadow-glow">{initials(user)}</div>
            <p className="mt-4 text-xl font-black text-graphite-950">{fullName(user)}</p>
            <p className="text-sm text-graphite-400">{user.email}</p>
            <div className="mt-3"><RoleBadge role={user.role} /></div>
            <div className="mt-6 w-full rounded-xl border border-graphite-100 bg-white/70 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-safe-600">
                <ShieldCheck size={14} /> Secure workspace
              </div>
              <p className="mt-2 text-xs leading-5 text-graphite-500">Your account controls role-based access to inspections, maintenance, reports, and equipment records.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={saveProfile} className="liquid-card p-6">
            <div className="liquid-inner">
              <h3 className="text-sm font-black text-graphite-900">Personal Information</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="First name" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                <Input label="Last name" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                <Input label="Email" value={user.email} disabled className="sm:col-span-2 opacity-60" />
              </div>
              <div className="mt-4 flex justify-end"><Button type="submit" icon={Save} loading={savingProfile}>Save changes</Button></div>
            </div>
          </form>

          <form onSubmit={savePassword} className="liquid-card p-6">
            <div className="liquid-inner">
              <h3 className="text-sm font-black text-graphite-900">Password & Security</h3>
              <div className="mt-4 space-y-4">
                <div className="relative">
                  <Input label="Current password" type={show ? 'text' : 'password'} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-[36px] text-graphite-400 hover:text-graphite-600">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="New password" type={show ? 'text' : 'password'} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                  <Input label="Confirm new password" type={show ? 'text' : 'password'} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex justify-end"><Button type="submit" variant="secondary" icon={KeyRound} loading={savingPw}>Update password</Button></div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
