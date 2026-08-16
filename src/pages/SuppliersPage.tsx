import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { SupplierFormModal } from '../components/SupplierFormModal';
import { SupplierStatementModal } from '../components/SupplierStatementModal';
import { fetchSuppliers, type Supplier } from '../api/suppliers';

function money(n: string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);

  function load() {
    setLoading(true);
    fetchSuppliers()
      .then(setSuppliers)
      .catch(() => setError('تعذّر تحميل الموردين'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q) ||
        (s.email ?? '').toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  function openCreate() {
    setEditingSupplier(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormOpen(true);
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">الموردون</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + إضافة مورد
        </button>
      </div>

      <input
        type="text"
        placeholder="ابحث بالاسم أو الجوال أو البريد..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-400">جارِ التحميل...</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">المورد</th>
                <th className="px-4 py-3 text-start font-medium">الرصيد (مستحق له)</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.phone ?? s.email ?? '—'}</p>
                  </td>
                  <td className={`px-4 py-3 font-medium ${Number(s.balance) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {money(s.balance)} ر.س
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {s.isActive ? 'نشط' : 'معطّل'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => setStatementSupplier(s)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      كشف حساب
                    </button>
                    <button onClick={() => openEdit(s)} className="ms-3 text-sm text-blue-600 hover:underline">
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    لا يوجد موردون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <SupplierFormModal open={formOpen} supplier={editingSupplier} onClose={() => setFormOpen(false)} onSaved={load} />
      <SupplierStatementModal
        open={statementSupplier !== null}
        supplier={statementSupplier}
        onClose={() => setStatementSupplier(null)}
      />
    </Layout>
  );
}
