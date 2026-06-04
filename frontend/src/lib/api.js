import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

export const tokenStore = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try a one-time refresh, then replay the request.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const message = response?.data?.errors?.[0]?.message || response?.data?.message || 'Network error. Please try again.';

    if (response?.status === 401 && !config._retry && tokenStore.refresh) {
      config._retry = true;
      try {
        refreshing = refreshing || axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: tokenStore.refresh });
        const { data } = await refreshing;
        refreshing = null;
        tokenStore.set({ accessToken: data.data.accessToken });
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(config);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    }
    const err = new Error(message);
    err.code = response?.data?.code;     // e.g. EMAIL_NOT_VERIFIED, INVALID_OTP
    err.status = response?.status;
    return Promise.reject(err);
  }
);

export default api;
