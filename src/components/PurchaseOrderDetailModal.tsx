import { useEffect, useState } from 'react';
import {
  fetchPurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  receivePurchaseOrder,
  type PurchaseOrder,
} from '../api/purchases';
import { ApiError } from '../api/client';
import { StatusStepper } from './StatusStepper';

interface PurchaseOrderDetailModalProps {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  CONFIRMED: 'معتمد',
  PARTIALLY_RECEIVED: 'مستلم جزئيًا',
  RECEIVED: 'مستلم بالكامل',
  CANCELLED: 'ملغى',
};

const PURCHASE_STAGES = [
  { key: 'DRAFT', label: 'مسودة' },
  { key: 'CONFIRMED', label: 'معتمد' },
  { key: 'RECEIVED', label: 'مستلم' },
];

/** Maps a purchase order status to its stepper position. */
function purchaseStageInfo(status: string) {
  switch (status) {
    case 'DRAFT':
      return { index: 0, inProgress: false };
    case 'CONFIRMED':
      return { index: 1, inProgress: false };
    case 'PARTIALLY_RECEIVED':
      return { index: 2, inProgress: true };
    case 'RECEIVED':
      return { index: 2, inProgress: false };
    default:
      return { index: 0, inProgress: false };
  }
}

function money(n: string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

export function PurchaseOrderDetailModal({ open, orderId, onClose, onChanged }: PurchaseOrderDetailModalProps) {
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});

  function load() {
    if (!orderId) return;
    setLoading(true);
    fetchPurchaseOrder(orderId)
      .then(setOrder)
      .catch(() => setError('تعذّر تحميل تفاصيل الطلب'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (open && orderId) {
      load();
      setReceiving(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  if (!open || !orderId) return null;

  async function handleConfirm() {
    if (!orderId) return;
    setBusy(true);
    setError(null);
    try {
      await confirmPurchaseOrder(orderId);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!orderId || !confirm('إلغاء طلب الشراء هذا؟')) return;
    setBusy(true);
    setError(null);
    try {
      await cancelPurchaseOrder(orderId);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  }

  function startReceiving() {
    if (!order) return;
    const initial: Record<string, string> = {};
    for (const item of order.items) {
      const remaining = item.orderedQuantity - item.receivedQuantity;
      if (remaining > 0) initial[item.productId] = String(remaining);
    }
    setReceiveQty(initial);
    setReceiving(true);
  }

  async function submitReceive() {
    if (!orderId) return;
    const items = Object.entries(receiveQty)
      .map(([productId, qty]) => ({ productId, quantity: Number(qty) }))
      .filter((i) => i.quantity > 0);

    if (items.length === 0) {
      setError('أدخل كمية استلام واحدة على الأقل');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await receivePurchaseOrder(orderId, items);
      setReceiving(false);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء الاستلام');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        {loading && <p className="py-8 text-center text-gray-400">جارِ التحميل...</p>}

        {!loading && order && (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{order.orderNumber}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {order.supplier?.name} — {order.branch?.name} — {order.warehouse?.name}
                </p>
              </div>
            </div>

            <div className="mb-5 overflow-x-auto pb-1">
              <StatusStepper
                stages={PURCHASE_STAGES}
                currentIndex={purchaseStageInfo(order.status).index}
                inProgress={purchaseStageInfo(order.status).inProgress}
                cancelled={order.status === 'CANCELLED'}
                cancelledLabel={STATUS_LABELS.CANCELLED}
              />
            </div>

            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">الصنف</th>
                    <th className="px-3 py-2 text-start font-medium">مطلوب</th>
                    <th className="px-3 py-2 text-start font-medium">مستلم</th>
                    <th className="px-3 py-2 text-start font-medium">تكلفة الوحدة</th>
                    {receiving && <th className="px-3 py-2 text-start font-medium">استلام الآن</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => {
                    const remaining = item.orderedQuantity - item.receivedQuantity;
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-800">{item.product.name}</p>
                          <p className="text-xs text-gray-400">{item.product.sku}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{item.orderedQuantity}</td>
                        <td className="px-3 py-2 text-gray-600">{item.receivedQuantity}</td>
                        <td className="px-3 py-2 text-gray-600">{money(item.unitCost)}</td>
                        {receiving && (
                          <td className="px-3 py-2">
                            {remaining > 0 ? (
                              <input
                                type="number"
                                min="0"
                                max={remaining}
                                value={receiveQty[item.productId] ?? ''}
                                onChange={(e) =>
                                  setReceiveQty((prev) => ({ ...prev, [item.productId]: e.target.value }))
                                }
                                className="w-20 rounded border border-gray-300 px-2 py-1"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">مكتمل</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mb-4 flex justify-between text-sm">
              <span className="text-gray-500">ملاحظات: {order.notes ?? '—'}</span>
              <span className="font-bold text-gray-800">الإجمالي: {money(order.totalAmount)} ر.س</span>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                إغلاق
              </button>

              {order.status === 'DRAFT' && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={busy}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    إلغاء الطلب
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    اعتماد الطلب
                  </button>
                </>
              )}

              {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') && !receiving && (
                <>
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={handleCancel}
                      disabled={busy}
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      إلغاء الطلب
                    </button>
                  )}
                  <button
                    onClick={startReceiving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    استلام
                  </button>
                </>
              )}

              {receiving && (
                <>
                  <button
                    onClick={() => setReceiving(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    تراجع
                  </button>
                  <button
                    onClick={submitReceive}
                    disabled={busy}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {busy ? 'جارِ الاستلام...' : 'تأكيد الاستلام'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
