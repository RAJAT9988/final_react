/**
 * Access / refresh token storage for api_back JWT auth.
 */

const ACCESS_TOKEN_KEY = 'bp-access-token';
const REFRESH_TOKEN_KEY = 'bp-refresh-token';

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (tokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
