import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../ui/States';

// Requires a logged-in user; optionally restricts to roles.
export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingState label="Loading your workspace…" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Redirects logged-in users away from auth pages.
export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// Inline role gate for hiding UI bits (buttons, etc.).
export function RoleGate({ roles, children, fallback = null }) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? children : fallback;
}
