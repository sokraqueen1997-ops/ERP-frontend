import { apiFetch } from './client';

export interface Account {
  id: string;
  name: string;
  type: string;
  bankName: string | null;
  accountNumber: string | null;
  iban: string | null;
  balance: string;
  isActive: boolean;
}

export function fetchAccounts() {
  return apiFetch<Account[]>('/accounting/accounts');
}

export interface AccountInput {
  name: string;
  type: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  openingBalance?: number;
}

export function createAccount(input: AccountInput) {
  return apiFetch<Account>('/accounting/accounts', { method: 'POST', body: JSON.stringify(input) });
}

export function updateAccount(
  id: string,
  input: Partial<Omit<AccountInput, 'openingBalance'>> & { isActive?: boolean },
) {
  return apiFetch<Account>(`/accounting/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export interface AccountTransaction {
  id: string;
  voucherNumber: string;
  type: string;
  category: string;
  amount: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
  relatedCustomer?: { id: string; name: string } | null;
  relatedSupplier?: { id: string; name: string } | null;
}

export interface LedgerResponse {
  items: AccountTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function fetchAccountLedger(id: string, page = 1) {
  return apiFetch<LedgerResponse>(`/accounting/accounts/${id}/ledger?page=${page}`);
}

export interface VoucherInput {
  amount: number;
  category?: string;
  description?: string;
  relatedCustomerId?: string;
  relatedSupplierId?: string;
}

export function createReceipt(accountId: string, input: VoucherInput) {
  return apiFetch<AccountTransaction>(`/accounting/accounts/${accountId}/receipts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createPayment(accountId: string, input: VoucherInput) {
  return apiFetch<AccountTransaction>(`/accounting/accounts/${accountId}/payments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface ProfitLossReport {
  period: { from: string; to: string };
  revenueInclVat: number;
  returnsInclVat: number;
  netSalesInclVat: number;
  vatCollected: number;
  revenueExclVat: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  returnsCount: number;
  notes: string[];
}

export function fetchProfitLoss(from: string, to: string) {
  return apiFetch<ProfitLossReport>(`/accounting/reports/profit-loss?from=${from}&to=${to}`);
}

export interface VatReport {
  period: { from: string; to: string };
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  note: string;
}

export function fetchVatReport(from: string, to: string) {
  return apiFetch<VatReport>(`/accounting/reports/vat?from=${from}&to=${to}`);
}

export interface AgingBucket {
  label: string;
  total: number;
  customerCount: number;
}

export interface AgingCustomerRow {
  customerId: string;
  customerName: string;
  phone: string | null;
  balance: number;
  daysOutstanding: number;
  bucket: string;
}

export interface AgingReport {
  asOf: string;
  totalOutstanding: number;
  buckets: AgingBucket[];
  customers: AgingCustomerRow[];
  note: string;
}

export function fetchAgingReport() {
  return apiFetch<AgingReport>('/accounting/reports/aging');
}
