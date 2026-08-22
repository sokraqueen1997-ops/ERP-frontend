import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCategories, type Category } from '../api/categories';
import { fetchSuppliers, type Supplier } from '../api/suppliers';
import { createProduct, updateProduct, type Product, type ProductInput } from '../api/products';
import { ApiError } from '../api/client';

interface ProductFormModalProps {
  open: boolean;
  product: Product | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  supplierId: '',
  manufacturer: '',
  unit: 'قطعة',
  priceRetail: '',
  priceWholesale: '',
  priceContractor: '',
  priceProject: '',
  costPrice: '',
  minStockLevel: '0',
  vatRate: '15',
  isVatApplicable: true,
  isActive: true,
};

export function ProductFormModal({ open, product, onClose, onSaved }: ProductFormModalProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchCategories().then(setCategories).catch(() => setCategories([]));
    fetchSuppliers().then(setSuppliers).catch(() => setSuppliers([]));

    if (product) {
      setForm({
        sku: product.sku,
        barcode: product.barcode ?? '',
        name: product.name,
        description: product.description ?? '',
        categoryId: product.categoryId ?? '',
        supplierId: product.supplierId ?? '',
        manufacturer: product.manufacturer ?? '',
        unit: product.unit,
        priceRetail: product.priceRetail,
        priceWholesale: product.priceWholesale,
        priceContractor: product.priceContractor,
        priceProject: product.priceProject,
        costPrice: product.costPrice ?? '',
        minStockLevel: String(product.minStockLevel),
        vatRate: product.vatRate,
        isVatApplicable: product.isVatApplicable,
        isActive: product.isActive,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, product]);

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: ProductInput = {
      sku: form.sku,
      barcode: form.barcode || undefined,
      name: form.name,
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,
      supplierId: form.supplierId || undefined,
      manufacturer: form.manufacturer || undefined,
      unit: form.unit || undefined,
      priceRetail: Number(form.priceRetail),
      priceWholesale: Number(form.priceWholesale),
      priceContractor: Number(form.priceContractor),
      priceProject: Number(form.priceProject),
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      minStockLevel: form.minStockLevel ? Number(form.minStockLevel) : undefined,
      vatRate: form.vatRate ? Number(form.vatRate) : undefined,
      isVatApplicable: form.isVatApplicable,
      ...(product ? { isActive: form.isActive } : {}),
    };

    try {
      if (product) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('productForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {product ? t('productForm.editTitle') : t('productForm.createTitle')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('productForm.sku')} *</label>
              <input
                className={inputClass}
                value={form.sku}
                onChange={(e) => update('sku', e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t('productForm.barcode')}</label>
              <input
                className={inputClass}
                value={form.barcode}
                onChange={(e) => update('barcode', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('productForm.name')} *</label>
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>

          <div>
            <label className={labelClass}>{t('productForm.description')}</label>
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('productForm.category')}</label>
              <select
                className={inputClass}
                value={form.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
              >
                <option value="">{t('productForm.selectCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('productForm.supplier')}</label>
              <select
                className={inputClass}
                value={form.supplierId}
                onChange={(e) => update('supplierId', e.target.value)}
              >
                <option value="">{t('productForm.noSupplier')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('productForm.manufacturer')}</label>
              <input
                className={inputClass}
                value={form.manufacturer}
                onChange={(e) => update('manufacturer', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t('productForm.unit')}</label>
              <input className={inputClass} value={form.unit} onChange={(e) => update('unit', e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">{t('productForm.pricesTitle')}</p>
            <div className="grid grid-cols-4 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={t('productForm.priceRetail')}
                className={inputClass}
                value={form.priceRetail}
                onChange={(e) => update('priceRetail', e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={t('productForm.priceWholesale')}
                className={inputClass}
                value={form.priceWholesale}
                onChange={(e) => update('priceWholesale', e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={t('productForm.priceContractor')}
                className={inputClass}
                value={form.priceContractor}
                onChange={(e) => update('priceContractor', e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={t('productForm.priceProject')}
                className={inputClass}
                value={form.priceProject}
                onChange={(e) => update('priceProject', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('productForm.costPrice')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.costPrice}
                onChange={(e) => update('costPrice', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t('productForm.minStockLevel')}</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.minStockLevel}
                onChange={(e) => update('minStockLevel', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t('productForm.vatRate')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.vatRate}
                onChange={(e) => update('vatRate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isVatApplicable}
                onChange={(e) => update('isVatApplicable', e.target.checked)}
              />
              {t('productForm.vatApplicable')}
            </label>
            {product && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => update('isActive', e.target.checked)}
                />
                {t('productForm.active')}
              </label>
            )}
          </div>

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
