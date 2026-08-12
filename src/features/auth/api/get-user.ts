/**
 * Profile API — GET /api/v1/profile
 *
 * Asks the backend: "who is the logged-in user?"
 * Needs a Bearer access token (api-client adds it automatically).
 */

import { api } from '@/lib/api-client';
import { clearTokens, getAccessToken } from '@/lib/auth-tokens';
import { ApiResponse, User } from '@/types/api';

// ========== 1) MAIN API CALL ==========
// Return the current user, or null if not logged in
export const getUser = async (): Promise<User | null> => {
  // No token saved → user is not logged in (do not call the API)
  if (!getAccessToken()) {
    return null;
  }

  try {
    // THIS LINE talks to the backend:
    // GET {API_URL}/api/v1/profile
    // Token is attached automatically by api-client
    const response = await api.get<never, ApiResponse<User>>('/api/v1/profile');

    // Return the user inside `data`, or null if missing
    return response.data ?? null;
  } catch {
    // Token bad/expired, timeout, or network error → treat as logged out
    clearTokens();
    return null;
  }
};
