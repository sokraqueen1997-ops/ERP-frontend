import { apiFetch } from './client';

export interface StockRow {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    minStockLevel: number;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
}

export function fetchStock(warehouseId?: string) {
  const qs = warehouseId ? `?warehouseId=${warehouseId}` : '';
  return apiFetch<StockRow[]>(`/inventory/stock${qs}`);
}

export function fetchLowStock() {
  return apiFetch<StockRow[]>('/inventory/low-stock');
}

export interface AdjustStockInput {
  productId: string;
  warehouseId: string;
  quantityChange: number;
  notes?: string;
}

export function adjustStock(input: AdjustStockInput) {
  return apiFetch('/inventory/adjust', { method: 'POST', body: JSON.stringify(input) });
}
