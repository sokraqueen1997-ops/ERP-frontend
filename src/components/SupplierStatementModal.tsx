import { useEffect, useState } from 'react';
import { fetchSupplierStatement, type Supplier, type SupplierTransaction } from '../api/suppliers';

interface SupplierStatementModalProps {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  OPENING_BALANCE: 'رصيد افتتاحي',
  PURCHASE: 'مشتريات',
  PAYMENT: 'دفعة',
  DEBIT_NOTE: 'إشعار مدين',
  ADJUSTMENT: 'تسوية',
};

function money(n: string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function SupplierStatementModal({ open, supplier, onClose }: SupplierStatementModalProps) {
  const [items, setItems] = useState<SupplierTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !supplier) return;
    setLoading(true);
    fetchSupplierStatement(supplier.id, page)
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [open, supplier, page]);

  useEffect(() => {
    if (open) setPage(1);
  }, [open, supplier]);

  if (!open || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">كشف حساب — {supplier.name}</h2>
            <p className="mt-1 text-sm text-gray-500">
              الرصيد الحالي (مستحق للمورد):{' '}
              <span className={Number(supplier.balance) > 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-600'}>
                {money(supplier.balance)} ر.س
              </span>
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
                  <th className="px-3 py-2 text-start font-medium">التاريخ</th>
                  <th className="px-3 py-2 text-start font-medium">النوع</th>
                  <th className="px-3 py-2 text-start font-medium">المبلغ</th>
                  <th className="px-3 py-2 text-start font-medium">الرصيد بعدها</th>
                  <th className="px-3 py-2 text-start font-medium">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 text-gray-600">{formatDate(t.createdAt)}</td>
                    <td className="px-3 py-2 text-gray-600">{TYPE_LABELS[t.type] ?? t.type}</td>
                    <td className={`px-3 py-2 ${Number(t.amount) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {money(t.amount)}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{money(t.balanceAfter)}</td>
                    <td className="px-3 py-2 text-gray-400">{t.notes ?? '—'}</td>
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
