import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('th_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Mutex promise to deduplicate concurrent refresh calls on page reloads
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('th_refresh_token');
      if (refresh) {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken: refresh,
              });
              const newAccessToken = data.data.accessToken as string;
              const newRefreshToken = data.data.refreshToken as string;
              localStorage.setItem('th_access_token', newAccessToken);
              localStorage.setItem('th_refresh_token', newRefreshToken);
              return newAccessToken;
            } catch (refreshErr) {
              localStorage.removeItem('th_access_token');
              localStorage.removeItem('th_refresh_token');
              throw refreshErr;
            } finally {
              refreshPromise = null;
            }
          })();
        }

        try {
          const newAccessToken = await refreshPromise;
          original.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(original);
        } catch {
          return Promise.reject(error);
        }
      }
    }
    return Promise.reject(error);
  },
);

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

export function getErrorMessage(err: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | undefined;
    return data?.error?.message || err.message || fallback;
  }
  return fallback;
}
