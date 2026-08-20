import { useEffect, useState, type FormEvent } from 'react';
import { createWarehouse, updateWarehouse, type Warehouse, type WarehouseInput } from '../api/warehouses';
import { fetchBranches, type Branch } from '../api/branches';
import { ApiError } from '../api/client';

interface WarehouseFormModalProps {
  open: boolean;
  warehouse: Warehouse | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = { name: '', code: '', branchId: '', isActive: true };

export function WarehouseFormModal({ open, warehouse, onClose, onSaved }: WarehouseFormModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchBranches().then(setBranches);
    if (warehouse) {
      setForm({
        name: warehouse.name,
        code: warehouse.code,
        branchId: warehouse.branchId,
        isActive: warehouse.isActive,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, warehouse]);

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.branchId) {
      setError('اختر الفرع');
      return;
    }

    setSubmitting(true);

    const payload: WarehouseInput = {
      name: form.name,
      code: form.code,
      branchId: form.branchId,
      ...(warehouse ? { isActive: form.isActive } : {}),
    };

    try {
      if (warehouse) {
        await updateWarehouse(warehouse.id, payload);
      } else {
        await createWarehouse(payload);
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
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">{warehouse ? 'تعديل مستودع' : 'مستودع جديد'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>اسم المستودع *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              autoFocus
          />
          </div>
          <div>
            <label className={labelClass}>رمز المستودع *</label>
            <input className={inputClass} value={form.code} onChange={(e) => update('code', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>الفرع *</label>
            <select className={inputClass} value={form.branchId} onChange={(e) => update('branchId', e.target.value)}>
              <option value="">اختر فرع...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {warehouse && (
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
