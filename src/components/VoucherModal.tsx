import { useEffect, useState, type FormEvent } from 'react';
import { createReceipt, createPayment, type Account } from '../api/accounting';
import { fetchCustomers, type Customer } from '../api/customers';
import { fetchSuppliers, type Supplier } from '../api/suppliers';
import { ApiError } from '../api/client';

interface VoucherModalProps {
  open: boolean;
  kind: 'RECEIPT' | 'PAYMENT';
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
}

const RECEIPT_CATEGORIES = [
  { value: 'SALES_COLLECTION', label: 'تحصيل مبيعات' },
  { value: 'OWNER_DEPOSIT', label: 'إيداع من المالك' },
  { value: 'OTHER_INCOME', label: 'إيراد آخر' },
  { value: 'OTHER', label: 'أخرى' },
];

const PAYMENT_CATEGORIES = [
  { value: 'SUPPLIER_PAYMENT', label: 'دفعة لمورد' },
  { value: 'EXPENSE', label: 'مصروف' },
  { value: 'OWNER_WITHDRAWAL', label: 'سحب للمالك' },
  { value: 'OTHER', label: 'أخرى' },
];

export function VoucherModal({ open, kind, account, onClose, onSaved }: VoucherModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(kind === 'RECEIPT' ? 'SALES_COLLECTION' : 'EXPENSE');
  const [description, setDescription] = useState('');
  const [partyId, setPartyId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setCategory(kind === 'RECEIPT' ? 'SALES_COLLECTION' : 'EXPENSE');
    setDescription('');
    setPartyId('');
    setError(null);
    if (kind === 'RECEIPT') {
      fetchCustomers().then((all) => setCustomers(all.filter((c) => c.isActive)));
    } else {
      fetchSuppliers().then((all) => setSuppliers(all.filter((s) => s.isActive)));
    }
  }, [open, kind]);

  if (!open || !account) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setError('أدخل مبلغ صحيح');
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        amount: amountNum,
        category,
        description: description || undefined,
        ...(kind === 'RECEIPT' ? { relatedCustomerId: partyId || undefined } : { relatedSupplierId: partyId || undefined }),
      };
      if (kind === 'RECEIPT') {
        await createReceipt(account!.id, input);
      } else {
        await createPayment(account!.id, input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  }

  const categories = kind === 'RECEIPT' ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES;
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-gray-800">
          {kind === 'RECEIPT' ? 'سند قبض جديد' : 'سند صرف جديد'}
        </h2>
        <p className="mb-4 text-sm text-gray-500">{account.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>المبلغ *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>التصنيف</label>
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              {kind === 'RECEIPT' ? 'العميل (اختياري — يحدّث رصيده أيضًا)' : 'المورد (اختياري — يحدّث رصيده أيضًا)'}
            </label>
            <select className={inputClass} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              <option value="">بدون</option>
              {kind === 'RECEIPT'
                ? customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>وصف / ملاحظات</label>
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                kind === 'RECEIPT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'جارِ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
