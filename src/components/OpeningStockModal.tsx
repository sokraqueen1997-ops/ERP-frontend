import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { adjustStock } from '../api/inventory';
import { fetchProducts, type Product } from '../api/products';
import { fetchWarehouses, type Warehouse } from '../api/warehouses';
import { ApiError } from '../api/client';

interface OpeningStockModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function OpeningStockModal({ open, onClose, onSaved }: OpeningStockModalProps) {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState(t('openingStockModal.defaultNote'));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchWarehouses().then(setWarehouses);
    setWarehouseId('');
    setProductSearch('');
    setProductResults([]);
    setSelectedProduct(null);
    setQuantity('');
    setNotes(t('openingStockModal.defaultNote'));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetchProducts({ search: productSearch, isActive: true }).then(setProductResults);
    }, 250);
    return () => clearTimeout(timeout);
  }, [productSearch]);

  if (!open) return null;

  function selectProduct(product: Product) {
    setSelectedProduct(product);
    setProductSearch('');
    setProductResults([]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedProduct) {
      setError(t('openingStockModal.selectProductError'));
      return;
    }
    if (!warehouseId) {
      setError(t('openingStockModal.selectWarehouseError'));
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError(t('openingStockModal.quantityError'));
      return;
    }

    setSubmitting(true);
    try {
      await adjustStock({
        productId: selectedProduct.id,
        warehouseId,
        quantityChange: qty,
        notes: notes || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('openingStockModal.saveError'));
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
        <h2 className="mb-4 text-lg font-bold text-gray-800">{t('openingStockModal.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className={labelClass}>{t('openingStockModal.product')} *</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <span className="text-gray-800">
                  {selectedProduct.name} <span className="text-xs text-gray-400">({selectedProduct.sku})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {t('openingStockModal.changeProduct')} ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder={t('openingStockModal.productSearchPlaceholder')}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                {productResults.length > 0 && (
                  <div className="absolute inset-x-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProduct(p)}
                        className="block w-full px-3 py-2 text-start text-sm hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-800">{p.name}</span>{' '}
                        <span className="text-xs text-gray-400">{p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className={labelClass}>{t('openingStockModal.warehouse')} *</label>
            <select className={inputClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">{t('openingStockModal.selectWarehouse')}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t('openingStockModal.quantity')} *</label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>{t('openingStockModal.notes')}</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
