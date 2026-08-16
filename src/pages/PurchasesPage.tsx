import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CreatePurchaseOrderModal } from '../components/CreatePurchaseOrderModal';
import { PurchaseOrderDetailModal } from '../components/PurchaseOrderDetailModal';
import { fetchPurchaseOrders, type PurchaseOrder } from '../api/purchases';

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'DRAFT', label: 'مسودة' },
  { value: 'CONFIRMED', label: 'معتمد' },
  { value: 'PARTIALLY_RECEIVED', label: 'مستلم جزئيًا' },
  { value: 'RECEIVED', label: 'مستلم بالكامل' },
  { value: 'CANCELLED', label: 'ملغى' },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  CONFIRMED: 'معتمد',
  PARTIALLY_RECEIVED: 'مستلم جزئيًا',
  RECEIVED: 'مستلم بالكامل',
  CANCELLED: 'ملغى',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PARTIALLY_RECEIVED: 'bg-amber-50 text-amber-700',
  RECEIVED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

function money(n: string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchPurchaseOrders(status || undefined)
      .then((res) => setOrders(res.items))
      .catch(() => setError('تعذّر تحميل طلبات الشراء'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status]);

  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">المشتريات</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + طلب شراء جديد
        </button>
      </div>

      <select className={`${inputClass} mb-4`} value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-400">جارِ التحميل...</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">رقم الطلب</th>
                <th className="px-4 py-3 text-start font-medium">المورد</th>
                <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setDetailOrderId(o.id)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{money(o.totalAmount)} ر.س</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    لا توجد طلبات شراء
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreatePurchaseOrderModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <PurchaseOrderDetailModal
        open={detailOrderId !== null}
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
        onChanged={load}
      />
    </Layout>
  );
}
