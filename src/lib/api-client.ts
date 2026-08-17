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
    const method = String(error.config?.method ?? '').toUpperCase();

    // Quiet session check — used by getUser / AuthLoader
    const isSilentAuthCheck =
      requestUrl.includes('/v1/profile') ||
      requestUrl.includes('/api/v1/profile');
    // First setup step loads this unit before login
    const isCurrentDevice =
      requestUrl.includes('/v1/devices/current') ||
      requestUrl.includes('/api/v1/devices/current');
    const isSilentHealthMiss =
      method === 'GET' &&
      requestUrl.includes('/health/latest') &&
      error.response?.status === 404;

    if (!isSilentAuthCheck && !isSilentHealthMiss) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      const responseText =
        typeof responseData === 'string' ? responseData : undefined;

      const detail =
        responseData &&
        typeof responseData === 'object' &&
        'detail' in responseData
          ? (responseData as { detail?: unknown }).detail
          : undefined;

      const messageFromDetail =
        (typeof detail === 'string' && detail) ||
        (Array.isArray(detail) &&
          detail
            .map((item: { msg?: string }) => item?.msg)
            .filter(Boolean)
            .join(', '));

      const messageFromResponse =
        messageFromDetail ||
        (responseData &&
        typeof responseData === 'object' &&
        'message' in responseData
          ? String((responseData as { message?: unknown }).message ?? '')
          : undefined) ||
        (responseData &&
        typeof responseData === 'object' &&
        'error' in responseData
          ? String((responseData as { error?: unknown }).error ?? '')
          : undefined);

      const isNetworkError =
        !error.response &&
        (error.code === 'ERR_NETWORK' || error.message === 'Network Error');

      const isHtmlErrorPage =
        typeof responseText === 'string' &&
        (responseText.includes('<!DOCTYPE') ||
          responseText.includes('Traceback (most recent call last)'));

      const message = isNetworkError
        ? 'Cannot reach the backend. Start FastAPI on port 8000, then restart `npm run dev` so the Vite proxy picks up .env changes.'
        : isHtmlErrorPage && status === 500
          ? `Backend error (HTTP 500) on ${method} ${requestUrl}. Check the FastAPI terminal — this is often a database connection or migration issue.`
          : messageFromResponse ||
            (typeof error.message === 'string' ? error.message : null) ||
            `Request failed${typeof status === 'number' ? ` (HTTP ${status})` : ''}.`;

      const safeMessage =
        typeof message === 'string' && message.trim().length > 0
          ? message
          : 'Request failed';

      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Request failed',
        message: safeMessage,
      });
    }

    if (
      error.response?.status === 401 &&
      !isSilentAuthCheck &&
      !isCurrentDevice
    ) {
      const searchParams = new URLSearchParams();
      const redirectTo =
        searchParams.get('redirectTo') || window.location.pathname;
      window.location.href = paths.setup.login.getHref(redirectTo);
    }

    return Promise.reject(error);
  },
);
