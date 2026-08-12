/**
 * ========== API CLIENT (how the frontend talks to the backend) ==========
 * Axios instance with Bearer token + shared error handling.
 */

import Axios, { InternalAxiosRequestConfig } from 'axios';

import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { paths } from '@/config/paths';

import { getAccessToken } from './auth-tokens';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  config.withCredentials = false;

  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
  // Prevent AuthLoader / forms from spinning forever if the API is unreachable
  timeout: 10000,
});

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },

  (error) => {
    const requestUrl = String(error.config?.url ?? '');

    // Quiet session check — used by getUser / AuthLoader
    const isSilentAuthCheck = requestUrl.includes('/api/v1/profile');

    if (!isSilentAuthCheck) {
      const detail = error.response?.data?.detail;
      const message =
        (typeof detail === 'string' && detail) ||
        (Array.isArray(detail) &&
          detail
            .map((item: { msg?: string }) => item?.msg)
            .filter(Boolean)
            .join(', ')) ||
        error.response?.data?.message ||
        error.message;

      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Error',
        message: typeof message === 'string' ? message : 'Request failed',
      });
    }

    if (error.response?.status === 401 && !isSilentAuthCheck) {
      const searchParams = new URLSearchParams();
      const redirectTo =
        searchParams.get('redirectTo') || window.location.pathname;
      window.location.href = paths.setup.login.getHref(redirectTo);
    }

    return Promise.reject(error);
  },
);
