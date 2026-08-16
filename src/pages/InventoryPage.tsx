import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { OpeningStockModal } from '../components/OpeningStockModal';
import { fetchStock, fetchLowStock, type StockRow } from '../api/inventory';
import { fetchWarehouses, type Warehouse } from '../api/warehouses';

export function InventoryPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [stock, setStock] = useState<StockRow[]>([]);
  const [lowStockIds, setLowStockIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [adjustingRow, setAdjustingRow] = useState<StockRow | null>(null);
  const [openingStockOpen, setOpeningStockOpen] = useState(false);

  useEffect(() => {
    fetchWarehouses().then(setWarehouses);
  }, []);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([fetchStock(warehouseId || undefined), fetchLowStock()])
      .then(([stockRows, lowRows]) => {
        setStock(stockRows);
        setLowStockIds(new Set(lowRows.map((r) => r.id)));
      })
      .catch(() => setError(t('inventory.loadError')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [warehouseId]);

  const rows = showLowStockOnly ? stock.filter((r) => lowStockIds.has(r.id)) : stock;

  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('inventory.title')}</h1>
        <button
          onClick={() => setOpeningStockOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('inventory.addAdjustButton')}
        </button>
      </div>

      {lowStockIds.size > 0 && !showLowStockOnly && (
        <button
          onClick={() => setShowLowStockOnly(true)}
          className="mb-4 flex w-full items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 hover:bg-red-100"
        >
          <span>⚠️ {t('inventory.lowStockAlert', { count: lowStockIds.size })}</span>
          <span className="underline">{t('inventory.showOnly')}</span>
        </button>
      )}

      <div className="mb-4 flex items-center gap-3">
        <select className={inputClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="">{t('inventory.allWarehouses')}</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {showLowStockOnly && (
          <button
            onClick={() => setShowLowStockOnly(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            {t('inventory.clearLowStockFilter')}
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-400">{t('common.loading')}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('inventory.colItem')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('inventory.colWarehouse')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('inventory.colBalance')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('inventory.colMinLevel')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('inventory.colStatus')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const isLow = lowStockIds.has(r.id);
                return (
                  <tr key={r.id} className={isLow ? 'bg-red-50/50' : undefined}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.product.name}</p>
                      <p className="text-xs text-gray-400">{r.product.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.warehouse.name}</td>
                    <td className={`px-4 py-3 font-medium ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                      {r.quantity} {r.product.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.product.minStockLevel}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          {t('inventory.statusLow')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                          {t('inventory.statusGood')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => setAdjustingRow(r)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {t('inventory.adjustBalance')}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {t('inventory.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <StockAdjustModal
        open={adjustingRow !== null}
        row={adjustingRow}
        onClose={() => setAdjustingRow(null)}
        onSaved={load}
      />
      <OpeningStockModal open={openingStockOpen} onClose={() => setOpeningStockOpen(false)} onSaved={load} />
    </Layout>
  );
}
