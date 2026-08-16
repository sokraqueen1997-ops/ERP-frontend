import { apiFetch } from './client';

export interface Permission {
  id: string;
  key: string;
  module: string;
  description: string | null;
}

export function fetchPermissions() {
  return apiFetch<Permission[]>('/permissions');
}
