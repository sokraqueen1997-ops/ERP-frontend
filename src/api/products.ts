import { apiFetch } from './client';

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  supplierId: string | null;
  manufacturer: string | null;
  imageUrl: string | null;
  unit: string;
  priceRetail: string;
  priceWholesale: string;
  priceContractor: string;
  priceProject: string;
  costPrice: string | null;
  minStockLevel: number;
  vatRate: string;
  isVatApplicable: boolean;
  isActive: boolean;
  category?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
}

export interface ProductListParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export function fetchProducts(params: ProductListParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  const qs = query.toString();
  return apiFetch<Product[]>(`/products${qs ? `?${qs}` : ''}`);
}

export interface ProductInput {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  supplierId?: string;
  manufacturer?: string;
  unit?: string;
  priceRetail: number;
  priceWholesale: number;
  priceContractor: number;
  priceProject: number;
  costPrice?: number;
  minStockLevel?: number;
  vatRate?: number;
  isVatApplicable?: boolean;
  isActive?: boolean;
}

export function createProduct(input: ProductInput) {
  return apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(input) });
}

export function updateProduct(id: string, input: Partial<ProductInput>) {
  return apiFetch<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deactivateProduct(id: string) {
  return apiFetch<Product>(`/products/${id}`, { method: 'DELETE' });
}
