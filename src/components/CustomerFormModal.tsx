import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createCustomer, updateCustomer, type Customer, type CustomerInput } from '../api/customers';
import { ApiError } from '../api/client';

interface CustomerFormModalProps {
  open: boolean;
  customer: Customer | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  customerType: 'RETAIL',
  vatNumber: '',
  creditLimit: '0',
  isActive: true,
};

export function CustomerFormModal({ open, customer, onClose, onSaved }: CustomerFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const CUSTOMER_TYPES = [
    { value: 'RETAIL', label: t('customers.typeRetail') },
    { value: 'WHOLESALE', label: t('customers.typeWholesale') },
    { value: 'CONTRACTOR', label: t('customers.typeContractor') },
    { value: 'PROJECT', label: t('customers.typeProject') },
  ];

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        address: customer.address ?? '',
        customerType: customer.customerType,
        vatNumber: customer.vatNumber ?? '',
        creditLimit: customer.creditLimit,
        isActive: customer.isActive,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, customer]);

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: CustomerInput = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      customerType: form.customerType,
      vatNumber: form.vatNumber || undefined,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
      ...(customer ? { isActive: form.isActive } : {}),
    };

    try {
      if (customer) {
        await updateCustomer(customer.id, payload);
      } else {
        await createCustomer(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('customerForm.saveError'));
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
          {customer ? t('customerForm.editTitle') : t('customerForm.createTitle')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>{t('customerForm.name')} *</label>
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('customerForm.phone')}</label>
              <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t('customerForm.email')}</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('customerForm.address')}</label>
            <input className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('customerForm.customerType')}</label>
              <select
                className={inputClass}
                value={form.customerType}
                onChange={(e) => update('customerType', e.target.value)}
              >
                {CUSTOMER_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('customerForm.creditLimit')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.creditLimit}
                onChange={(e) => update('creditLimit', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('customerForm.vatNumber')}</label>
            <input
              className={inputClass}
              value={form.vatNumber}
              onChange={(e) => update('vatNumber', e.target.value)}
            />
          </div>

          {customer && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
              {t('customerForm.active')}
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? t('productForm.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
