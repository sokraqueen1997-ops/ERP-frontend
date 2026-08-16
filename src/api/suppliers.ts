import { apiFetch } from './client';

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: string;
  isActive: boolean;
  createdAt: string;
}

export function fetchSuppliers() {
  return apiFetch<Supplier[]>('/suppliers');
}

export interface SupplierInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export function createSupplier(input: SupplierInput) {
  return apiFetch<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(input) });
}

export function updateSupplier(id: string, input: Partial<SupplierInput>) {
  return apiFetch<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export interface SupplierTransaction {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  notes: string | null;
  createdAt: string;
}

export interface SupplierStatementResponse {
  items: SupplierTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function fetchSupplierStatement(id: string, page = 1) {
  return apiFetch<SupplierStatementResponse>(`/suppliers/${id}/statement?page=${page}`);
}
