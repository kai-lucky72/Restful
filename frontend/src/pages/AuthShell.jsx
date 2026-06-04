import { Flame, Shield, ClipboardCheck, Building2, CheckCircle2 } from 'lucide-react';

const ROLES = [
  { icon: Shield, name: 'Admin', desc: 'Full fleet oversight, assignments & audit trail' },
  { icon: ClipboardCheck, name: 'Inspector', desc: 'Field inspections, results & maintenance logs' },
  { icon: Building2, name: 'Client', desc: 'Track your extinguishers, requests & compliance' },
];

export default function AuthShell({ children }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0a0e17]">
      {/* Ambient gradient field */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-fire-600/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 left-1/3 h-[30rem] w-[30rem] rounded-full bg-amber-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[32rem] w-[32rem] rounded-full bg-sky-600/15 blur-[120px]" />

      {/* Brand panel */}
      <div className="relative hidden w-[52%] flex-col justify-between p-12 text-white lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fire-500 to-fire-700 shadow-[0_16px_40px_-12px_rgba(220,38,38,0.8)]">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">TZW FireSafe</p>
            <p className="text-xs font-medium text-white/45">Fire Extinguisher Management</p>
          </div>
        </div>

        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-safe-400" /> Industrial safety, operational clarity
          </div>
          <h1 className="max-w-lg text-[2.7rem] font-extrabold leading-[1.05] tracking-tight">
            Every extinguisher,<br /><span className="bg-gradient-to-r from-fire-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">accounted for.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/60">
            TZW LTD manages fire-safety equipment for schools, hotels, companies and shops — one workspace, three roles, total compliance.
          </p>

          <div className="mt-9 space-y-3">
            {ROLES.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 text-amber-200 ring-1 ring-white/10">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-xs leading-5 text-white/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/35">
          <CheckCircle2 size={14} className="text-safe-400" /> © {new Date().getFullYear()} TZW LTD · Secured workspace
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full items-center justify-center p-6 lg:w-[48%]">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
