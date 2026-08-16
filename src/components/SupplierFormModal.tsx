import { useEffect, useState, type FormEvent } from 'react';
import { createSupplier, updateSupplier, type Supplier, type SupplierInput } from '../api/suppliers';
import { ApiError } from '../api/client';

interface SupplierFormModalProps {
  open: boolean;
  supplier: Supplier | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  isActive: true,
};

export function SupplierFormModal({ open, supplier, onClose, onSaved }: SupplierFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (supplier) {
      setForm({
        name: supplier.name,
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        address: supplier.address ?? '',
        isActive: supplier.isActive,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, supplier]);

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: SupplierInput = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      ...(supplier ? { isActive: form.isActive } : {}),
    };

    try {
      if (supplier) {
        await updateSupplier(supplier.id, payload);
      } else {
        await createSupplier(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {supplier ? 'تعديل مورد' : 'إضافة مورد جديد'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>الاسم *</label>
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>الجوال</label>
              <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>البريد الإلكتروني</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>العنوان</label>
            <input className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>

          {supplier && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
              نشط
            </label>
          )}

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
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'جارِ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
