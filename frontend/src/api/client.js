import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track whether a redirect is already in progress to avoid multiple simultaneous redirects
let isRedirecting = false;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Network error (backend down, CORS, DNS failure) — surface a clear message
    if (!err.response) {
      err.message = 'Cannot reach the server. Please check your connection or try again.';
      return Promise.reject(err);
    }

    if (err.response.status === 401) {
      // Only clear auth and redirect once — avoids redirect storm when multiple
      // concurrent requests all get 401 at the same time (common on session expiry)
      if (!isRedirecting && window.location.pathname !== '/login') {
        isRedirecting = true;
        localStorage.removeItem('hs_token');
        localStorage.removeItem('hs_user');
        window.location.href = '/login';
        // Reset after navigation completes so future logins work normally
        setTimeout(() => { isRedirecting = false; }, 3000);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
