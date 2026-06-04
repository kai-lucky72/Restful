export default function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-graphite-950 md:text-[2.1rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 sm:pb-1">{actions}</div>}
    </div>
  );
}
