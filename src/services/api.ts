import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/store/auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let isRefreshing = false;
let waitingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  waitingQueue.forEach((item) => {
    if (error) {
      item.reject(error);
      return;
    }
    item.resolve(token ?? '');
  });
  waitingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh-token')) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    const { refreshToken, user, setAuth, logout } = useAuthStore.getState();
    if (!refreshToken || !user) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitingQueue.push({ resolve: (token) => resolve(token), reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshClient.post<{ accessToken: string }>('/auth/refresh-token', {
        refreshToken,
      });

      if (!data?.accessToken) {
        throw new Error('Refresh token sem access token de retorno.');
      }

      setAuth({
        token: data.accessToken,
        refreshToken,
        user,
      });

      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      flushQueue(null, data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
