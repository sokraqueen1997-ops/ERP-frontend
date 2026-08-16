import { apiFetch } from './client';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  branchId: string;
}

export function fetchWarehouses() {
  return apiFetch<Warehouse[]>('/warehouses');
}
