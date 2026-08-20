import { apiFetch } from './client';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  branchId: string;
  isActive: boolean;
  branch?: { id: string; name: string };
}

export interface WarehouseInput {
  name?: string;
  code?: string;
  branchId?: string;
  isActive?: boolean;
}

export function fetchWarehouses() {
  return apiFetch<Warehouse[]>('/warehouses');
}

export function createWarehouse(input: WarehouseInput) {
  return apiFetch<Warehouse>('/warehouses', { method: 'POST', body: JSON.stringify(input) });
}

export function updateWarehouse(id: string, input: WarehouseInput) {
  return apiFetch<Warehouse>(`/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}
