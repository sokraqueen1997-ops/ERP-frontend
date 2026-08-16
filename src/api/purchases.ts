import { apiFetch } from './client';

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  branchId: string;
  warehouseId: string;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: string;
  vatAmount: string;
  lineTotal: string;
  product: { id: string; name: string; sku: string; unit: string };
}

export interface PurchaseOrder {
  id: string;
  orderSeq: number;
  orderNumber: string;
  supplierId: string;
  branchId: string;
  warehouseId: string;
  subtotal: string;
  discountAmount: string;
  vatAmount: string;
  totalAmount: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items: PurchaseOrderItem[];
  supplier?: { id: string; name: string };
  branch?: { id: string; name: string };
  warehouse?: { id: string; name: string };
}

export interface PurchaseOrderListResponse {
  items: PurchaseOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function fetchPurchaseOrders(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<PurchaseOrderListResponse>(`/purchases${qs}`);
}

export function fetchPurchaseOrder(id: string) {
  return apiFetch<PurchaseOrder>(`/purchases/${id}`);
}

export function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  return apiFetch<PurchaseOrder>('/purchases', { method: 'POST', body: JSON.stringify(input) });
}

export function confirmPurchaseOrder(id: string) {
  return apiFetch<PurchaseOrder>(`/purchases/${id}/confirm`, { method: 'POST' });
}

export function cancelPurchaseOrder(id: string) {
  return apiFetch<PurchaseOrder>(`/purchases/${id}/cancel`, { method: 'POST' });
}

export interface ReceiveItemInput {
  productId: string;
  quantity: number;
}

export function receivePurchaseOrder(id: string, items: ReceiveItemInput[]) {
  return apiFetch<PurchaseOrder>(`/purchases/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
