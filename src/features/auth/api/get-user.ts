/**
 * Profile API — GET /v1/profile
 *
 * Returns the logged-in UserDTO. Needs a Bearer access token.
 */

import { api } from '@/lib/api-client';
import { clearTokens, getAccessToken } from '@/lib/auth-tokens';
import { User } from '@/types/api';

type ProfileDto = {
  user_id: string;
  name: string;
  email: string;
  role_id: number;
  company_id: string;
  status: string;
  mfa_enabled: boolean;
  role_name?: string | null;
  is_deleted?: boolean;
};

const toUser = (dto: ProfileDto): User => {
  const userId = String(dto.user_id);
  return {
    id: userId,
    user_id: userId,
    name: dto.name,
    email: dto.email,
    role_id: dto.role_id,
    company_id: String(dto.company_id),
    status: dto.status,
    mfa_enabled: dto.mfa_enabled,
    role_name: dto.role_name,
    is_deleted: dto.is_deleted,
    firstName: dto.name,
  };
};

export const getUser = async (): Promise<User | null> => {
  if (!getAccessToken()) {
    return null;
  }

  try {
    const dto = await api.get<never, ProfileDto>('/v1/profile');
    if (!dto?.user_id) {
      return null;
    }
    return toUser(dto);
  } catch {
    clearTokens();
    return null;
  }
};
