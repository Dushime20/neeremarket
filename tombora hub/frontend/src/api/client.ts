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

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('th_refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refresh,
          });
          localStorage.setItem('th_access_token', data.data.accessToken);
          localStorage.setItem('th_refresh_token', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('th_access_token');
          localStorage.removeItem('th_refresh_token');
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
