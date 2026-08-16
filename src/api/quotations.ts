import { apiFetch } from './client';

export interface QuotationItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateQuotationInput {
  customerId: string;
  branchId: string;
  validUntil: string; // ISO date
  notes?: string;
  items: QuotationItemInput[];
}

export interface ReviseQuotationInput {
  customerId: string;
  branchId: string;
  validUntil: string;
  notes?: string;
  items: QuotationItemInput[];
}

export interface QuotationItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  vatAmount: string;
  lineTotal: string;
  product: { id: string; name: string; sku: string; unit: string };
}

export interface Quotation {
  id: string;
  quoteSeq: number;
  quoteNumber: string;
  version: number;
  previousVersionId: string | null;
  customerId: string;
  branchId: string;
  validUntil: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  vatAmount: string;
  totalAmount: string;
  notes: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  convertedSaleId: string | null;
  createdAt: string;
  items: QuotationItem[];
  isExpired: boolean;
  customer?: { id: string; name: string; phone?: string | null };
  branch?: { id: string; name: string };
}

export interface QuotationListResponse {
  items: Quotation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function fetchQuotations(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<QuotationListResponse>(`/quotations${qs}`);
}

export function fetchQuotation(id: string) {
  return apiFetch<Quotation>(`/quotations/${id}`);
}

export function createQuotation(input: CreateQuotationInput) {
  return apiFetch<Quotation>('/quotations', { method: 'POST', body: JSON.stringify(input) });
}

export function reviseQuotation(id: string, input: ReviseQuotationInput) {
  return apiFetch<Quotation>(`/quotations/${id}/revise`, { method: 'POST', body: JSON.stringify(input) });
}

export function sendQuotation(id: string) {
  return apiFetch<Quotation>(`/quotations/${id}/send`, { method: 'POST' });
}

export function acceptQuotation(id: string) {
  return apiFetch<Quotation>(`/quotations/${id}/accept`, { method: 'POST' });
}

export function rejectQuotation(id: string) {
  return apiFetch<Quotation>(`/quotations/${id}/reject`, { method: 'POST' });
}

export interface ConvertQuotationInput {
  warehouseId: string;
  paymentMethod: string;
}

export interface ConvertQuotationResult {
  quotation: Quotation;
  sale: { id: string; invoiceNumber: string; totalAmount: string };
}

export function convertQuotation(id: string, input: ConvertQuotationInput) {
  return apiFetch<ConvertQuotationResult>(`/quotations/${id}/convert`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
