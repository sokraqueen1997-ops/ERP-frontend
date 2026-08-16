import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { setLanguage } from '../i18n';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(usernameOrEmail, password, needsTwoFactor ? twoFactorCode : undefined);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.message.toLowerCase().includes('two-factor')) {
        setNeedsTwoFactor(true);
        setError(t('login.twoFactorHint'));
      } else {
        setError(t('login.invalidCredentials'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-end gap-1 text-xs font-medium">
          <button
            onClick={() => setLanguage('ar')}
            className={`rounded px-2 py-1 ${i18n.language === 'ar' ? 'bg-blue-50 text-blue-700' : 'text-gray-400'}`}
          >
            العربية
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`rounded px-2 py-1 ${i18n.language === 'en' ? 'bg-blue-50 text-blue-700' : 'text-gray-400'}`}
          >
            English
          </button>
        </div>

        <h1 className="mb-1 text-xl font-bold text-gray-800">{t('login.title')}</h1>
        <p className="mb-6 text-sm text-gray-400">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.usernameLabel')}</label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {needsTwoFactor && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.twoFactorLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
