import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchCustomerStatement,
  openCustomerStatementPrint,
  type Customer,
  type CustomerTransaction,
} from '../api/customers';

interface CustomerStatementModalProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerStatementModal({ open, customer, onClose }: CustomerStatementModalProps) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<CustomerTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const TYPE_LABELS: Record<string, string> = {
    OPENING_BALANCE: t('customerStatement.typeOpeningBalance'),
    INVOICE: t('customerStatement.typeInvoice'),
    PAYMENT: t('customerStatement.typePayment'),
    CREDIT_NOTE: t('customerStatement.typeCreditNote'),
    ADJUSTMENT: t('customerStatement.typeAdjustment'),
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
    if (!open || !customer) return;
    setLoading(true);
    fetchCustomerStatement(customer.id, page, { from: from || undefined, to: to || undefined })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [open, customer, page, from, to]);

  useEffect(() => {
    if (open) {
      setPage(1);
      setFrom('');
      setTo('');
    }
  }, [open, customer]);

  if (!open || !customer) return null;

  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {t('customerStatement.title', { name: customer.name })}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('customerStatement.currentBalance')}{' '}
              <span className={Number(customer.balance) > 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-600'}>
                {money(customer.balance)} {t('common.sar')}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">من تاريخ</label>
            <input
              type="date"
              className={inputClass}
              value={from}
              onChange={(e) => {
                setPage(1);
                setFrom(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">إلى تاريخ</label>
            <input
              type="date"
              className={inputClass}
              value={to}
              onChange={(e) => {
                setPage(1);
                setTo(e.target.value);
              }}
            />
          </div>
          <button
            onClick={() => openCustomerStatementPrint(customer.id, { from: from || undefined, to: to || undefined })}
            className="rounded-lg bg-gray-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            طباعة / حفظ PDF
          </button>
        </div>

        {loading && <p className="py-8 text-center text-gray-400">{t('common.loading')}</p>}

        {!loading && (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">{t('customerStatement.colDate')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('customerStatement.colType')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('customerStatement.colAmount')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('customerStatement.colBalanceAfter')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('customerStatement.colNotes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-3 py-2 text-gray-600">{formatDate(tx.createdAt)}</td>
                    <td className="px-3 py-2 text-gray-600">{TYPE_LABELS[tx.type] ?? tx.type}</td>
                    <td className={`px-3 py-2 ${Number(tx.amount) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {money(tx.amount)}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{money(tx.balanceAfter)}</td>
                    <td className="px-3 py-2 text-gray-400">{tx.notes ?? '—'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                      {t('customerStatement.noTransactions')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
            >
              {t('customerStatement.previous')}
            </button>
            <span className="text-gray-500">{t('customerStatement.pageOf', { page, totalPages })}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
            >
              {t('customerStatement.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
