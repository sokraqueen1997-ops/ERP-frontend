import { useEffect, useState } from 'react';
import { fetchRoleDetail, updateRole, type Role } from '../api/roles';
import { fetchPermissions, type Permission } from '../api/permissions';
import { ApiError } from '../api/client';

interface RolePermissionsModalProps {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSaved: () => void;
}

const MODULE_LABELS: Record<string, string> = {
  users: 'المستخدمون',
  roles: 'الأدوار',
  branches: 'الفروع',
  audit: 'سجل العمليات',
  products: 'المنتجات',
  inventory: 'المخزون',
  customers: 'العملاء',
  suppliers: 'الموردون',
  sales: 'المبيعات',
  purchases: 'المشتريات',
  quotations: 'عروض الأسعار',
  invoices: 'الفواتير',
  accounting: 'المحاسبة',
  reports: 'التقارير',
  settings: 'الإعدادات',
};

export function RolePermissionsModal({ open, role, onClose, onSaved }: RolePermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !role) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchPermissions(), fetchRoleDetail(role.id)])
      .then(([perms, detail]) => {
        setPermissions(perms);
        setSelected(new Set(detail.permissionKeys));
      })
      .catch(() => setError('تعذّر تحميل الصلاحيات'))
      .finally(() => setLoading(false));
  }, [open, role]);

  if (!open || !role) return null;

  const byModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleModule(modulePerms: Permission[], allSelected: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of modulePerms) {
        if (allSelected) next.delete(p.key);
        else next.add(p.key);
      }
      return next;
    });
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      const permissionIds = permissions.filter((p) => selected.has(p.key)).map((p) => p.id);
      await updateRole(role!.id, { permissionIds });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-gray-800">صلاحيات الدور — {role.name}</h2>
        {role.isSystem && (
          <p className="mb-4 text-xs text-amber-600">هذا دور نظامي أساسي — عدّل بحذر.</p>
        )}

        {loading && <p className="py-8 text-center text-gray-400">جارِ التحميل...</p>}

        {!loading && (
          <div className="space-y-4">
            {Object.entries(byModule).map(([module, perms]) => {
              const allSelected = perms.every((p) => selected.has(p.key));
              return (
                <div key={module} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">{MODULE_LABELS[module] ?? module}</p>
                    <button
                      type="button"
                      onClick={() => toggleModule(perms, allSelected)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={selected.has(p.key)} onChange={() => toggle(p.key)} />
                        {p.description ?? p.key}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'جارِ الحفظ...' : 'حفظ الصلاحيات'}
          </button>
        </div>
      </div>
    </div>
  );
}
