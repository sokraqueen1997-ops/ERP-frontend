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

export function fetchCustomerStatement(id: string, page = 1) {
  return apiFetch<StatementResponse>(`/customers/${id}/statement?page=${page}`);
}
