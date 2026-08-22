import { apiFetch } from './client';

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  customerId: string;
  branchId: string;
  warehouseId: string;
  paymentMethod: string;
  discountAmount?: number;
  notes?: string;
  items: SaleItemInput[];
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  vatAmount: string;
  lineTotal: string;
  product: { id: string; name: string; sku: string };
}

export interface Sale {
  id: string;
  invoiceSeq: number;
  invoiceNumber: string;
  customerId: string;
  branchId: string;
  warehouseId: string;
  subtotal: string;
  discountAmount: string;
  vatAmount: string;
  totalAmount: string;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items: SaleItem[];
}

export function createSale(input: CreateSaleInput) {
  return apiFetch<Sale>('/sales', { method: 'POST', body: JSON.stringify(input) });
}

export interface SaleListItem {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customer: { id: string; name: string };
  branch: { id: string; name: string };
  warehouse: { id: string; name: string };
}

export interface SaleListResponse {
  items: SaleListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function fetchSales(params: { customerId?: string; page?: number } = {}) {
  const query = new URLSearchParams();
  if (params.customerId) query.set('customerId', params.customerId);
  if (params.page) query.set('page', String(params.page));
  const qs = query.toString();
  return apiFetch<SaleListResponse>(`/sales${qs ? `?${qs}` : ''}`);
}

/**
 * Fetches the printable invoice HTML and opens it in a new tab (auth header
 * required, so this can't be a plain link). The blank tab is opened
 * synchronously, before the network request, so browsers don't treat this
 * as an unsolicited popup (which they silently block once an `await` has
 * happened first) — we just point the already-open tab at the content once
 * it arrives.
 */
export async function openInvoiceInNewTab(saleId: string) {
  const newTab = window.open('', '_blank');
  try {
    const html = await apiFetch<string>(`/sales/${saleId}/invoice`);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    if (newTab) {
      newTab.location.href = url;
    } else {
      // Popup blocked even for the synchronous open (rare) — fall back to same-tab navigation.
      window.location.href = url;
    }
  } catch (err) {
    newTab?.close();
    throw err;
  }
}
