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

export interface StatementDateRange {
  from?: string;
  to?: string;
}

export function fetchSupplierStatement(id: string, page = 1, range: StatementDateRange = {}) {
  const params = new URLSearchParams({ page: String(page) });
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  return apiFetch<SupplierStatementResponse>(`/suppliers/${id}/statement?${params.toString()}`);
}

/**
 * Fetches the printable statement HTML and opens it in a new tab — the tab
 * is opened synchronously (before the network request) so browsers don't
 * treat this as an unsolicited popup.
 */
export async function openSupplierStatementPrint(id: string, range: StatementDateRange = {}) {
  const newTab = window.open('', '_blank');
  try {
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    const qs = params.toString();
    const html = await apiFetch<string>(`/suppliers/${id}/statement/print${qs ? `?${qs}` : ''}`);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    if (newTab) {
      newTab.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch (err) {
    newTab?.close();
    throw err;
  }
}
