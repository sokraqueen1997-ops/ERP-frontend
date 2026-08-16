import { useEffect, useState, type FormEvent } from 'react';
import { createUser, updateUser, type User, type CreateUserInput } from '../api/users';
import { fetchRoles, type Role } from '../api/roles';
import { fetchBranches, type Branch } from '../api/branches';
import { ApiError } from '../api/client';

interface UserFormModalProps {
  open: boolean;
  user: User | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  roleId: '',
  branchId: '',
  isActive: true,
};

export function UserFormModal({ open, user, onClose, onSaved }: UserFormModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchRoles().then(setRoles);
    fetchBranches().then(setBranches);
    if (user) {
      setForm({
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        password: '',
        roleId: user.roleId,
        branchId: user.branchId ?? '',
        isActive: user.isActive,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, user]);

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (user) {
        await updateUser(user.id, {
          fullName: form.fullName,
          email: form.email,
          username: form.username,
          roleId: form.roleId,
          branchId: form.branchId || undefined,
          isActive: form.isActive,
        });
      } else {
        const payload: CreateUserInput = {
          fullName: form.fullName,
          email: form.email,
          username: form.username,
          password: form.password,
          roleId: form.roleId,
          branchId: form.branchId || undefined,
        };
        await createUser(payload);
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">{user ? 'تعديل مستخدم' : 'مستخدم جديد'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>الاسم الكامل *</label>
            <input className={inputClass} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>اسم المستخدم *</label>
              <input className={inputClass} value={form.username} onChange={(e) => update('username', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>البريد الإلكتروني *</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
          </div>

          {!user && (
            <div>
              <label className={labelClass}>كلمة المرور *</label>
              <input
                type="password"
                className={inputClass}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={8}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>الدور *</label>
              <select className={inputClass} value={form.roleId} onChange={(e) => update('roleId', e.target.value)} required>
                <option value="">اختر دور...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>الفرع (اختياري)</label>
              <select className={inputClass} value={form.branchId} onChange={(e) => update('branchId', e.target.value)}>
                <option value="">بدون تقييد</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {user && (
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
