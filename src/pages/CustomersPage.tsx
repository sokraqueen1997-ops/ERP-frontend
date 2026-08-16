import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { CustomerStatementModal } from '../components/CustomerStatementModal';
import { fetchCustomers, type Customer } from '../api/customers';

export function CustomersPage() {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const TYPE_LABELS: Record<string, string> = {
    RETAIL: t('customers.typeRetail'),
    WHOLESALE: t('customers.typeWholesale'),
    CONTRACTOR: t('customers.typeContractor'),
    PROJECT: t('customers.typeProject'),
  };

  function money(n: string) {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n));
  }

  function load() {
    setLoading(true);
    fetchCustomers()
      .then(setCustomers)
      .catch(() => setError(t('customers.loadError')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    );
  }, [customers, search]);

  function openCreate() {
    setEditingCustomer(null);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('customers.title')}</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('customers.addButton')}
        </button>
      </div>

      <input
        type="text"
        placeholder={t('customers.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-400">{t('common.loading')}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('customers.colCustomer')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('customers.colType')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('customers.colBalance')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('customers.colCreditLimit')}</th>
                <th className="px-4 py-3 text-start font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.phone ?? c.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[c.customerType] ?? c.customerType}</td>
                  <td className={`px-4 py-3 font-medium ${Number(c.balance) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {money(c.balance)} {t('common.sar')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {money(c.creditLimit)} {t('common.sar')}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => setStatementCustomer(c)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      {t('customers.statement')}
                    </button>
                    <button onClick={() => openEdit(c)} className="ms-3 text-sm text-blue-600 hover:underline">
                      {t('customers.edit')}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    {t('customers.noCustomers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CustomerFormModal open={formOpen} customer={editingCustomer} onClose={() => setFormOpen(false)} onSaved={load} />
      <CustomerStatementModal
        open={statementCustomer !== null}
        customer={statementCustomer}
        onClose={() => setStatementCustomer(null)}
      />
    </Layout>
  );
}
