import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api';
import { tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load.
  useEffect(() => {
    (async () => {
      if (tokenStore.access) {
        try { setUser(await authApi.me()); }
        catch { tokenStore.clear(); }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { user, accessToken, refreshToken } = await authApi.login(email, password);
    tokenStore.set({ accessToken, refreshToken });
    setUser(user);
    return user;
  }, []);

  // Registration no longer logs in immediately — the email OTP must be verified first.
  const register = useCallback(async (payload) => {
    return authApi.register(payload); // { email, verificationRequired, devOtp? }
  }, []);

  // Verifying the OTP completes signup and logs the user in.
  const verifyOtp = useCallback(async (email, code) => {
    const { user, accessToken, refreshToken } = await authApi.verifyOtp(email, code);
    tokenStore.set({ accessToken, refreshToken });
    setUser(user);
    return user;
  }, []);

  const resendOtp = useCallback((email) => authApi.resendOtp(email), []);

  const logout = useCallback(async () => {
    try { await authApi.logout(tokenStore.refresh); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => user && roles.includes(user.role), [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, verifyOtp, resendOtp, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
