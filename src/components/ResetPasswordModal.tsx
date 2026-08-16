import { useEffect, useState, type FormEvent } from 'react';
import { resetPassword, type User } from '../api/users';
import { ApiError } from '../api/client';

interface ResetPasswordModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export function ResetPasswordModal({ open, user, onClose }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!open || !user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون ٨ أحرف على الأقل');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(user!.id, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-gray-800">إعادة تعيين كلمة المرور</h2>
        <p className="mb-4 text-sm text-gray-500">{user.fullName} ({user.username})</p>

        {success ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              تم تغيير كلمة المرور بنجاح. أبلغ المستخدم بكلمة المرور الجديدة.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">كلمة المرور الجديدة *</label>
              <input
                type="password"
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
            </div>

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
                {submitting ? 'جارِ الحفظ...' : 'تغيير كلمة المرور'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
