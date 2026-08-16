import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { fetchCustomers, type Customer } from '../api/customers';
import { fetchSales, openInvoiceInNewTab, type SaleListItem } from '../api/sales';

export function SalesHistoryPage() {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAYMENT_LABELS: Record<string, string> = {
    CASH: t('sales.paymentCash'),
    CARD: t('sales.paymentCard'),
    BANK_TRANSFER: t('sales.paymentBankTransfer'),
    CREDIT: t('sales.paymentCredit'),
  };

  function money(n: string) {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  useEffect(() => {
    fetchCustomers().then(setCustomers);
  }, []);

  function load() {
    setLoading(true);
    setError(null);
    fetchSales({ customerId: customerId || undefined, page })
      .then((res) => {
        setSales(res.items);
        setTotalPages(res.totalPages);
      })
      .catch(() => setError(t('salesHistory.loadError')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [customerId, page]);

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const filteredCustomers = customerSearch.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(customerSearch.trim().toLowerCase()))
    : customers;

  function selectCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setCustomerSearch('');
    setCustomerDropdownOpen(false);
    setPage(1);
  }

  function clearCustomer() {
    setCustomerId('');
    setCustomerSearch('');
    setPage(1);
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <Layout>
      <h1 className="mb-6 text-xl font-bold text-gray-800">{t('salesHistory.title')}</h1>

      <div className="relative mb-4 max-w-md">
        <label className="mb-1 block text-sm font-medium text-gray-700">{t('salesHistory.filterByCustomer')}</label>
        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <span className="text-gray-800">{selectedCustomer.name}</span>
            <button onClick={clearCustomer} className="text-xs text-gray-400 hover:text-gray-600">
              {t('salesHistory.showAll')} ✕
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder={t('salesHistory.searchPlaceholder')}
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onFocus={() => setCustomerDropdownOpen(true)}
              onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 150)}
              className={inputClass}
            />
            {customerDropdownOpen && filteredCustomers.length > 0 && (
              <div className="absolute inset-x-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectCustomer(c)}
                    className="block w-full px-3 py-2 text-start text-sm hover:bg-gray-50"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-400">{t('common.loading')}</p>}

      {!loading && !error && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('salesHistory.colInvoiceNumber')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('salesHistory.colCustomer')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('salesHistory.colDate')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('salesHistory.colPaymentMethod')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('salesHistory.colTotal')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{s.customer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {money(s.totalAmount)} {t('common.sar')}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => openInvoiceInNewTab(s.id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {t('salesHistory.viewPrint')}
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      {t('salesHistory.noInvoices')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                {t('salesHistory.previous')}
              </button>
              <span className="text-gray-500">{t('salesHistory.pageOf', { page, totalPages })}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                {t('salesHistory.next')}
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
