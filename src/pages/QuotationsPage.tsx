import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CreateQuotationModal } from '../components/CreateQuotationModal';
import { QuotationDetailModal } from '../components/QuotationDetailModal';
import { fetchQuotations, type Quotation } from '../api/quotations';

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'DRAFT', label: 'مسودة' },
  { value: 'SENT', label: 'مُرسل' },
  { value: 'ACCEPTED', label: 'مقبول' },
  { value: 'REJECTED', label: 'مرفوض' },
  { value: 'CONVERTED', label: 'محوّل لفاتورة' },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  SENT: 'مُرسل',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  EXPIRED: 'منتهي',
  REVISED: 'روجع',
  CONVERTED: 'محوّل',
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

function money(n: string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reviseTarget, setReviseTarget] = useState<Quotation | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchQuotations(status || undefined)
      .then((res) => setQuotations(res.items))
      .catch(() => setError('تعذّر تحميل عروض الأسعار'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status]);

  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  function handleRevise(quotation: Quotation) {
    setDetailId(null);
    setReviseTarget(quotation);
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">عروض الأسعار</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + عرض سعر جديد
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
                <th className="px-4 py-3 text-start font-medium">رقم العرض</th>
                <th className="px-4 py-3 text-start font-medium">العميل</th>
                <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((q) => (
                <tr key={q.id} onClick={() => setDetailId(q.id)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {q.quoteNumber} <span className="text-xs text-gray-400">(v{q.version})</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{q.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(q.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{money(q.totalAmount)} ر.س</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status] ?? q.status}
                    </span>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    لا توجد عروض أسعار
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateQuotationModal open={createOpen} reviseFrom={null} onClose={() => setCreateOpen(false)} onSaved={load} />
      <CreateQuotationModal
        open={reviseTarget !== null}
        reviseFrom={reviseTarget}
        onClose={() => setReviseTarget(null)}
        onSaved={load}
      />
      <QuotationDetailModal
        open={detailId !== null}
        quotationId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={load}
        onRevise={handleRevise}
      />
    </Layout>
  );
}
