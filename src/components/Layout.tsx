import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchCompanySettings } from '../api/companySettings';
import { setLanguage } from '../i18n';

interface NavItem {
  labelKey: string;
  path: string;
  enabled: boolean;
}

// As each module gets its screen built, flip `enabled: true` and it lights up here automatically.
const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', enabled: true },
  { labelKey: 'nav.products', path: '/products', enabled: true },
  { labelKey: 'nav.inventory', path: '/inventory', enabled: true },
  { labelKey: 'nav.sales', path: '/sales', enabled: true },
  { labelKey: 'nav.salesHistory', path: '/sales-history', enabled: true },
  { labelKey: 'nav.purchases', path: '/purchases', enabled: true },
  { labelKey: 'nav.quotations', path: '/quotations', enabled: true },
  { labelKey: 'nav.customers', path: '/customers', enabled: true },
  { labelKey: 'nav.suppliers', path: '/suppliers', enabled: true },
  { labelKey: 'nav.accounting', path: '/accounting', enabled: true },
  { labelKey: 'nav.settings', path: '/settings', enabled: true },
];

const FALLBACK_COMPANY_NAME = 'شركة علي عباس للأعمال العامة';

// Cached at module scope so we don't refetch on every page navigation (Layout remounts per page).
let cachedCompanyName: string | null = null;

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [companyName, setCompanyName] = useState(cachedCompanyName ?? FALLBACK_COMPANY_NAME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (cachedCompanyName) return;
    fetchCompanySettings()
      .then((settings) => {
        if (settings?.legalNameAr) {
          cachedCompanyName = settings.legalNameAr;
          setCompanyName(settings.legalNameAr);
        }
      })
      .catch(() => {
        // keep the fallback name if company settings aren't reachable
      });
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flow-line shrink-0" />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile backdrop — tapping it closes the menu */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`${
            mobileMenuOpen ? 'flex' : 'hidden'
          } fixed inset-y-0 z-50 w-64 shrink-0 flex-col bg-ink-900 md:static md:z-auto md:flex`}
        >
          <div className="border-b border-ink-700 px-5 py-4">
            <h1 className="text-lg font-bold text-white">ERP</h1>
            <p className="mt-0.5 text-xs text-brass-400">{companyName}</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            {NAV_ITEMS.map((item) =>
              item.enabled ? (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-e-4 border-brass-500 bg-ink-800 text-brass-400'
                        : 'text-slate-300 hover:bg-ink-800 hover:text-white'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ) : (
                <div
                  key={item.path}
                  className="flex cursor-not-allowed items-center justify-between px-5 py-2.5 text-sm text-slate-600"
                >
                  <span>{t(item.labelKey)}</span>
                  <span className="rounded-full bg-ink-700 px-2 py-0.5 text-[10px] text-slate-400">
                    {t('nav.comingSoon')}
                  </span>
                </div>
              ),
            )}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menu"
                className="text-gray-600 hover:text-gray-900 md:hidden"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                </svg>
              </button>
              <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs font-medium">
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1.5 transition-colors ${
                    i18n.language === 'ar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  العربية
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 transition-colors ${
                    i18n.language === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-end">
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.roleName}</p>
              </div>
              <button
                onClick={() => logout()}
                className="text-sm text-gray-500 transition-colors hover:text-red-600"
              >
                {t('common.logout')}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
