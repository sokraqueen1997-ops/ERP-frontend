import { useEffect, useState, type FormEvent } from 'react';
import { createAccount, updateAccount, type Account, type AccountInput } from '../api/accounting';
import { ApiError } from '../api/client';

interface AccountFormModalProps {
  open: boolean;
  account: Account | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  name: '',
  type: 'CASH',
  bankName: '',
  accountNumber: '',
  iban: '',
  openingBalance: '0',
  isActive: true,
};

export function AccountFormModal({ open, account, onClose, onSaved }: AccountFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (account) {
      setForm({
        name: account.name,
        type: account.type,
        bankName: account.bankName ?? '',
        accountNumber: account.accountNumber ?? '',
        iban: account.iban ?? '',
        openingBalance: '0',
        isActive: account.isActive,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, account]);

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (account) {
        await updateAccount(account.id, {
          name: form.name,
          bankName: form.bankName || undefined,
          accountNumber: form.accountNumber || undefined,
          iban: form.iban || undefined,
          isActive: form.isActive,
        });
      } else {
        const payload: AccountInput = {
          name: form.name,
          type: form.type,
          bankName: form.bankName || undefined,
          accountNumber: form.accountNumber || undefined,
          iban: form.iban || undefined,
          openingBalance: form.openingBalance ? Number(form.openingBalance) : undefined,
        };
        await createAccount(payload);
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
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {account ? 'تعديل حساب' : 'حساب جديد'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>اسم الحساب *</label>
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
          </div>

          {!account && (
            <div>
              <label className={labelClass}>النوع *</label>
              <select className={inputClass} value={form.type} onChange={(e) => update('type', e.target.value)}>
                <option value="CASH">صندوق نقدي</option>
                <option value="BANK">حساب بنكي</option>
              </select>
            </div>
          )}

          {(account?.type === 'BANK' || form.type === 'BANK') && (
            <>
              <div>
                <label className={labelClass}>اسم البنك</label>
                <input className={inputClass} value={form.bankName} onChange={(e) => update('bankName', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>رقم الحساب</label>
                  <input
                    className={inputClass}
                    value={form.accountNumber}
                    onChange={(e) => update('accountNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>الآيبان</label>
                  <input className={inputClass} value={form.iban} onChange={(e) => update('iban', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {!account && (
            <div>
              <label className={labelClass}>الرصيد الافتتاحي</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.openingBalance}
                onChange={(e) => update('openingBalance', e.target.value)}
              />
            </div>
          )}

          {account && (
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
