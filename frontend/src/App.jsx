import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnly } from './components/layout/Guards';
import { ROLES } from './lib/constants';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Extinguishers from './pages/Extinguishers';
import Requests from './pages/Requests';
import Inspections from './pages/Inspections';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/verify-otp" element={<PublicOnly><VerifyOtp /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/extinguishers" element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.USER]}><Extinguishers /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.USER]}><Requests /></ProtectedRoute>} />
        <Route path="/inspections" element={<Inspections />} />
        <Route path="/maintenance" element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.INSPECTOR]}><Maintenance /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.INSPECTOR, ROLES.USER]}><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={[ROLES.ADMIN]}><Users /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AuditLogs /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
