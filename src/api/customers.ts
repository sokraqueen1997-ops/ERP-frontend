import { apiFetch } from './client';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerType: string;
  vatNumber: string | null;
  creditLimit: string;
  balance: string;
  isActive: boolean;
  createdAt: string;
}

export function fetchCustomers() {
  return apiFetch<Customer[]>('/customers');
}

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customerType?: string;
  vatNumber?: string;
  creditLimit?: number;
  isActive?: boolean;
}

export function createCustomer(input: CustomerInput) {
  return apiFetch<Customer>('/customers', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCustomer(id: string, input: Partial<CustomerInput>) {
  return apiFetch<Customer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export interface CustomerTransaction {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  notes: string | null;
  createdAt: string;
}

export interface StatementResponse {
  items: CustomerTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatementDateRange {
  from?: string;
  to?: string;
}

export function fetchCustomerStatement(id: string, page = 1, range: StatementDateRange = {}) {
  const params = new URLSearchParams({ page: String(page) });
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  return apiFetch<StatementResponse>(`/customers/${id}/statement?${params.toString()}`);
}

/**
 * Fetches the printable statement HTML and opens it in a new tab — the tab
 * is opened synchronously (before the network request) so browsers don't
 * treat this as an unsolicited popup.
 */
export async function openCustomerStatementPrint(id: string, range: StatementDateRange = {}) {
  const newTab = window.open('', '_blank');
  try {
    const params = new URLSearchParams();
    if (range.from) params.set('from', range.from);
    if (range.to) params.set('to', range.to);
    const qs = params.toString();
    const html = await apiFetch<string>(`/customers/${id}/statement/print${qs ? `?${qs}` : ''}`);
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
