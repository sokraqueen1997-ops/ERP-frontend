import { useEffect, useState } from 'react';
import { fetchAccountLedger, type Account, type AccountTransaction } from '../api/accounting';

interface AccountLedgerModalProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  SALES_COLLECTION: 'تحصيل مبيعات',
  OWNER_DEPOSIT: 'إيداع من المالك',
  OTHER_INCOME: 'إيراد آخر',
  OPENING_BALANCE: 'رصيد افتتاحي',
  SUPPLIER_PAYMENT: 'دفعة لمورد',
  EXPENSE: 'مصروف',
  OWNER_WITHDRAWAL: 'سحب للمالك',
  OTHER: 'أخرى',
};

function money(n: string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function AccountLedgerModal({ open, account, onClose }: AccountLedgerModalProps) {
  const [items, setItems] = useState<AccountTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !account) return;
    setLoading(true);
    fetchAccountLedger(account.id, page)
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [open, account, page]);

  useEffect(() => {
    if (open) setPage(1);
  }, [open, account]);

  if (!open || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">كشف حساب — {account.name}</h2>
            <p className="mt-1 text-sm text-gray-500">
              الرصيد الحالي: <span className="font-semibold text-gray-800">{money(account.balance)} ر.س</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {loading && <p className="py-8 text-center text-gray-400">جارِ التحميل...</p>}

        {!loading && (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">السند</th>
                  <th className="px-3 py-2 text-start font-medium">التاريخ</th>
                  <th className="px-3 py-2 text-start font-medium">التصنيف</th>
                  <th className="px-3 py-2 text-start font-medium">المبلغ</th>
                  <th className="px-3 py-2 text-start font-medium">الرصيد بعدها</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 font-medium text-gray-800">{t.voucherNumber}</td>
                    <td className="px-3 py-2 text-gray-600">{formatDate(t.createdAt)}</td>
                    <td className="px-3 py-2 text-gray-600">{CATEGORY_LABELS[t.category] ?? t.category}</td>
                    <td className={`px-3 py-2 font-medium ${t.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'RECEIPT' ? '+' : '-'}
                      {money(t.amount)}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{money(t.balanceAfter)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                      لا توجد معاملات
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
              السابق
            </button>
            <span className="text-gray-500">
              صفحة {page} من {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
