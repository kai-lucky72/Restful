import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-graphite-50 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-fire-600 text-white"><Flame size={28} /></div>
      <h1 className="mt-6 text-5xl font-bold text-graphite-900">404</h1>
      <p className="mt-2 text-graphite-500">This page could not be found.</p>
      <Link to="/" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
