import { apiFetch } from './client';

export interface DashboardSummary {
  today: {
    salesCount: number;
    salesTotal: number;
  };
  inventory: {
    totalValue: number;
    unvaluedStockLines: number;
    lowStockCount: number;
  };
  receivables: {
    totalCustomerBalance: number;
  };
  payables: {
    totalSupplierBalance: number;
  };
  cashAndBank: {
    totalBalance: number;
  };
  thisMonth: {
    revenueExclVat: number;
    netProfit: number;
  };
}

export function fetchDashboardSummary() {
  return apiFetch<DashboardSummary>('/dashboard/summary');
}

export interface TopSellingEntry {
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  quantity: number;
  revenue: number;
}

export function fetchTopSellingProducts(limit = 5) {
  return apiFetch<TopSellingEntry[]>(`/dashboard/top-selling-products?limit=${limit}`);
}

export interface BranchSalesEntry {
  branchId: string;
  branchName: string;
  salesCount: number;
  total: number;
}

export function fetchSalesByBranch() {
  return apiFetch<BranchSalesEntry[]>('/dashboard/sales-by-branch');
}
