import { apiFetch } from './client';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export function fetchRoles() {
  return apiFetch<Role[]>('/roles');
}

export interface RoleDetail extends Role {
  permissionKeys: string[];
}

/**
 * The exact shape of `permissions` on a role-detail response wasn't verified
 * against the live backend, so this normalizes a few plausible shapes
 * (array of keys, array of {key}, array of {permission:{key}}) into a flat
 * string[] of permission keys. If the real shape differs, this will just
 * come back empty rather than throwing.
 */
export async function fetchRoleDetail(id: string): Promise<RoleDetail> {
  const raw = await apiFetch<{
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions?: unknown[];
  }>(`/roles/${id}`);

  const permissionKeys = (raw.permissions ?? [])
    .map((p) => {
      if (typeof p === 'string') return p;
      if (p && typeof p === 'object') {
        const obj = p as Record<string, unknown>;
        if (typeof obj.key === 'string') return obj.key;
        const nested = obj.permission as Record<string, unknown> | undefined;
        if (nested && typeof nested.key === 'string') return nested.key;
      }
      return '';
    })
    .filter(Boolean);

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isSystem: raw.isSystem,
    permissionKeys,
  };
}

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export function createRole(input: CreateRoleInput) {
  return apiFetch<Role>('/roles', { method: 'POST', body: JSON.stringify(input) });
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export function updateRole(id: string, input: UpdateRoleInput) {
  return apiFetch<Role>(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}
