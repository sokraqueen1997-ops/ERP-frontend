import { useEffect, useState } from 'react';
import {
  fetchQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  convertQuotation,
  type Quotation,
} from '../api/quotations';
import { fetchWarehouses, type Warehouse } from '../api/warehouses';
import { ApiError } from '../api/client';
import { buildWhatsAppLink } from '../utils/whatsapp';

interface QuotationDetailModalProps {
  open: boolean;
  quotationId: string | null;
  onClose: () => void;
  onChanged: () => void;
  onRevise: (quotation: Quotation) => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  SENT: 'مُرسل',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  EXPIRED: 'منتهي الصلاحية',
  REVISED: 'تمت مراجعته',
  CONVERTED: 'تم تحويله لفاتورة',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-50 text-blue-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-400',
  REVISED: 'bg-amber-50 text-amber-700',
  CONVERTED: 'bg-purple-50 text-purple-700',
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدي' },
  { value: 'CARD', label: 'بطاقة' },
  { value: 'BANK_TRANSFER', label: 'تحويل بنكي' },
  { value: 'CREDIT', label: 'آجل' },
];

function money(n: string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

function buildQuotationWaLink(q: Quotation): string | null {
  const waMessage =
    'مرحبًا ' +
    (q.customer?.name ?? '') +
    '، عرض السعر رقم ' +
    q.quoteNumber +
    ' بقيمة ' +
    money(q.totalAmount) +
    ' ريال جاهز، صالح حتى ' +
    new Date(q.validUntil).toLocaleDateString('ar-SA') +
    '. نتشرف بخدمتكم.';
  return buildWhatsAppLink(q.customer?.phone, waMessage);
}

export function QuotationDetailModal({ open, quotationId, onClose, onChanged, onRevise }: QuotationDetailModalProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [convertedSaleNumber, setConvertedSaleNumber] = useState<string | null>(null);

  function load() {
    if (!quotationId) return;
    setLoading(true);
    fetchQuotation(quotationId)
      .then(setQuotation)
      .catch(() => setError('تعذّر تحميل عرض السعر'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (open && quotationId) {
      load();
      fetchWarehouses().then(setWarehouses);
      setConverting(false);
      setConvertedSaleNumber(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quotationId]);

  if (!open || !quotationId) return null;

  async function runAction(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  }

  async function handleConvert() {
    if (!quotationId || !warehouseId) {
      setError('اختر المستودع');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await convertQuotation(quotationId, { warehouseId, paymentMethod });
      setConvertedSaleNumber(result.sale.invoiceNumber);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء التحويل');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const waLink = quotation ? buildQuotationWaLink(quotation) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        {loading && <p className="py-8 text-center text-gray-400">جارِ التحميل...</p>}

        {!loading && quotation && (
          <>
            {convertedSaleNumber && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <p className="font-bold text-green-700">تم التحويل بنجاح إلى فاتورة {convertedSaleNumber}</p>
              </div>
            )}

            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {quotation.quoteNumber} <span className="text-sm font-normal text-gray-400">(نسخة {quotation.version})</span>
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {quotation.customer?.name} — {quotation.branch?.name}
                </p>
                <p className="text-xs text-gray-400">
                  صالح حتى {new Date(quotation.validUntil).toLocaleDateString('ar-SA')}
                  {quotation.isExpired && <span className="text-red-500"> (منتهي)</span>}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[quotation.status]}`}>
                {STATUS_LABELS[quotation.status] ?? quotation.status}
              </span>
            </div>

            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">الصنف</th>
                    <th className="px-3 py-2 text-start font-medium">الكمية</th>
                    <th className="px-3 py-2 text-start font-medium">السعر</th>
                    <th className="px-3 py-2 text-start font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotation.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-800">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.product.sku}</p>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-600">{money(item.unitPrice)}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{money(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4 flex justify-between text-sm">
              <span className="text-gray-500">ملاحظات: {quotation.notes ?? '—'}</span>
              <span className="font-bold text-gray-800">الإجمالي: {money(quotation.totalAmount)} ر.س</span>
            </div>

            {converting && (
              <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">المستودع *</label>
                  <select className={inputClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                    <option value="">اختر مستودع...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">طريقة الدفع</label>
                  <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                إغلاق
              </button>

              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  إرسال عبر واتساب
                </a>
              )}

              {!convertedSaleNumber && quotation.status !== 'CONVERTED' && (
                <button
                  onClick={() => onRevise(quotation)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  مراجعة / تعديل السعر
                </button>
              )}

              {quotation.status === 'DRAFT' && (
                <button
                  onClick={() => runAction(() => sendQuotation(quotation.id))}
                  disabled={busy}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  إرسال للعميل
                </button>
              )}

              {quotation.status === 'SENT' && (
                <>
                  <button
                    onClick={() => runAction(() => rejectQuotation(quotation.id))}
                    disabled={busy}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    رفض
                  </button>
                  <button
                    onClick={() => runAction(() => acceptQuotation(quotation.id))}
                    disabled={busy}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    قبول
                  </button>
                </>
              )}

              {quotation.status === 'ACCEPTED' && !convertedSaleNumber && !converting && (
                <button
                  onClick={() => setConverting(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  تحويل إلى فاتورة
                </button>
              )}

              {converting && !convertedSaleNumber && (
                <button
                  onClick={handleConvert}
                  disabled={busy}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {busy ? 'جارِ التحويل...' : 'تأكيد التحويل'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
