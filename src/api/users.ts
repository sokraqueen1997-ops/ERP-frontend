import { apiFetch } from './client';

export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  isActive: boolean;
  roleId: string;
  branchId: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role?: { id: string; name: string };
  branch?: { id: string; name: string } | null;
}

export function fetchUsers() {
  return apiFetch<User[]>('/users');
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  username: string;
  password: string;
  roleId: string;
  branchId?: string;
}

export function createUser(input: CreateUserInput) {
  return apiFetch<User>('/users', { method: 'POST', body: JSON.stringify(input) });
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  username?: string;
  roleId?: string;
  branchId?: string;
  isActive?: boolean;
}

export function updateUser(id: string, input: UpdateUserInput) {
  return apiFetch<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function resetPassword(id: string, newPassword: string) {
  return apiFetch<{ success: boolean }>(`/users/${id}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
  });
}
