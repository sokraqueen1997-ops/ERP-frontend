import { apiFetch } from './client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  roleId: string;
  roleName: string;
  branchId: string | null;
  permissions: string[];
}

interface LoginResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

export function login(usernameOrEmail: string, password: string, twoFactorCode?: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usernameOrEmail, password, twoFactorCode }),
  });
}

export function logout(refreshToken: string) {
  return apiFetch<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function fetchMe() {
  return apiFetch<AuthenticatedUser>('/auth/me');
}
