import { useEffect, useState } from 'react';
import { fetchSuppliers, type Supplier } from '../api/suppliers';
import { fetchBranches, type Branch } from '../api/branches';
import { fetchWarehouses, type Warehouse } from '../api/warehouses';
import { fetchProducts, type Product } from '../api/products';
import { createPurchaseOrder } from '../api/purchases';
import { ApiError } from '../api/client';

interface CreatePurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface CartLine {
  product: Product;
  quantity: number;
  unitCost: number;
}

function money(n: number) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function CreatePurchaseOrderModal({ open, onClose, onCreated }: CreatePurchaseOrderModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchSuppliers().then((all) => setSuppliers(all.filter((s) => s.isActive)));
    fetchBranches().then(setBranches);
    fetchWarehouses().then(setWarehouses);
    setSupplierId('');
    setBranchId('');
    setWarehouseId('');
    setNotes('');
    setCart([]);
    setProductSearch('');
    setError(null);
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

  const warehousesForBranch = warehouses.filter((w) => w.branchId === branchId);

  function addProduct(product: Product) {
    setCart((prev) => {
      if (prev.some((l) => l.product.id === product.id)) return prev;
      return [...prev, { product, quantity: 1, unitCost: product.costPrice ? Number(product.costPrice) : 0 }];
    });
    setProductSearch('');
    setProductResults([]);
  }

  function updateLine(productId: string, patch: Partial<Pick<CartLine, 'quantity' | 'unitCost'>>) {
    setCart((prev) => prev.map((l) => (l.product.id === productId ? { ...l, ...patch } : l)));
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const total = cart.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  async function handleSubmit() {
    setError(null);
    if (!supplierId || !branchId || !warehouseId) {
      setError('اختر المورد والفرع والمستودع');
      return;
    }
    if (cart.length === 0) {
      setError('أضف صنف واحد على الأقل');
      return;
    }

    setSubmitting(true);
    try {
      await createPurchaseOrder({
        supplierId,
        branchId,
        warehouseId,
        notes: notes || undefined,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity, unitCost: l.unitCost })),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء إنشاء طلب الشراء');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">طلب شراء جديد</h2>

        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>المورد *</label>
            <select className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">اختر مورد...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>الفرع *</label>
            <select
              className={inputClass}
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setWarehouseId('');
              }}
            >
              <option value="">اختر فرع...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>المستودع *</label>
            <select
              className={inputClass}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              disabled={!branchId}
            >
              <option value="">اختر مستودع...</option>
              {warehousesForBranch.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative mb-4">
          <label className={labelClass}>إضافة صنف</label>
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الصنف..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className={inputClass}
          />
          {productResults.length > 0 && (
            <div className="absolute inset-x-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center justify-between px-3 py-2 text-start text-sm hover:bg-gray-50"
                >
                  <span>
                    <span className="font-medium text-gray-800">{p.name}</span>{' '}
                    <span className="text-xs text-gray-400">{p.sku}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-start font-medium">الصنف</th>
                <th className="px-3 py-2 text-start font-medium">الكمية</th>
                <th className="px-3 py-2 text-start font-medium">تكلفة الوحدة</th>
                <th className="px-3 py-2 text-start font-medium">الإجمالي</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.map((l) => (
                <tr key={l.product.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-800">{l.product.name}</p>
                    <p className="text-xs text-gray-400">{l.product.sku}</p>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.product.id, { quantity: Number(e.target.value) })}
                      className="w-20 rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.unitCost}
                      onChange={(e) => updateLine(l.product.id, { unitCost: Number(e.target.value) })}
                      className="w-24 rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">{money(l.quantity * l.unitCost)}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeLine(l.product.id)} className="text-red-500 hover:text-red-700">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                    لم تُضف أصناف بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <label className={labelClass}>ملاحظات</label>
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="mb-4 flex justify-end text-sm font-bold text-gray-800">
          الإجمالي (بدون ضريبة): {money(total)} ر.س
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'جارِ الحفظ...' : 'إنشاء طلب الشراء'}
          </button>
        </div>
      </div>
    </div>
  );
}
