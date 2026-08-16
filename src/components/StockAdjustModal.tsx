import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { adjustStock, type StockRow } from '../api/inventory';
import { ApiError } from '../api/client';

interface StockAdjustModalProps {
  open: boolean;
  row: StockRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function StockAdjustModal({ open, row, onClose, onSaved }: StockAdjustModalProps) {
  const { t } = useTranslation();
  const [quantityChange, setQuantityChange] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !row) return null;

  const change = Number(quantityChange) || 0;
  const newQuantity = row.quantity + change;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!row) return;
    setError(null);

    if (!quantityChange || change === 0) {
      setError(t('stockAdjustModal.zeroError'));
      return;
    }

    setSubmitting(true);
    try {
      await adjustStock({
        productId: row.productId,
        warehouseId: row.warehouseId,
        quantityChange: change,
        notes: notes || undefined,
      });
      onSaved();
      onClose();
      setQuantityChange('');
      setNotes('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('stockAdjustModal.saveError'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-gray-800">{t('stockAdjustModal.title')}</h2>
        <p className="mb-4 text-sm text-gray-500">
          {row.product.name} — {row.warehouse.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>{t('stockAdjustModal.currentBalance', { quantity: row.quantity })}</label>
            <label className={labelClass}>{t('stockAdjustModal.changeAmount')}</label>
            <input
              type="number"
              className={inputClass}
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              placeholder={t('stockAdjustModal.changePlaceholder')}
              autoFocus
            />
            {quantityChange && (
              <p className="mt-1 text-xs text-gray-500">
                {t('stockAdjustModal.newBalance', { quantity: newQuantity })}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t('stockAdjustModal.notes')}</label>
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
