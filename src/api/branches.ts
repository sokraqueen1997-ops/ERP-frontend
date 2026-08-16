import { apiFetch } from './client';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

export function fetchBranches() {
  return apiFetch<Branch[]>('/branches');
}

export interface BranchInput {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export function createBranch(input: BranchInput) {
  return apiFetch<Branch>('/branches', { method: 'POST', body: JSON.stringify(input) });
}

export function updateBranch(id: string, input: Partial<BranchInput>) {
  return apiFetch<Branch>(`/branches/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}
