import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Layout } from '../components/Layout';
import {
  fetchDashboardSummary,
  fetchTopSellingProducts,
  fetchSalesByBranch,
  type DashboardSummary,
  type TopSellingEntry,
  type BranchSalesEntry,
} from '../api/dashboard';

function todayFormatted(locale: string) {
  return new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type Tone = 'default' | 'danger' | 'success' | 'brass';

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  tone?: Tone;
  onClick?: () => void;
}

function KpiCard({ title, value, sub, tone = 'default', onClick }: KpiCardProps) {
  const toneClass: Record<Tone, string> = {
    default: 'text-gray-800',
    danger: 'text-red-600',
    success: 'text-blue-700',
    brass: 'text-brass-600',
  };

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-xl border border-gray-200 bg-white p-5 text-start ${
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`figure mt-2 text-2xl font-semibold ${toneClass[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </Wrapper>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopSellingEntry[]>([]);
  const [branchSales, setBranchSales] = useState<BranchSalesEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDashboardSummary(), fetchTopSellingProducts(5), fetchSalesByBranch()])
      .then(([summaryRes, topRes, branchRes]) => {
        setSummary(summaryRes);
        setTopProducts(topRes);
        setBranchSales(branchRes);
      })
      .catch(() => setError(t('dashboard.loadError')));
  }, [t]);

  function money(n: number) {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  const maxTopQuantity = Math.max(1, ...topProducts.map((p) => p.quantity));

  return (
    <Layout>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-400">{todayFormatted(i18n.language)}</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!summary && !error && <p className="text-gray-400">{t('common.loading')}</p>}

      {summary && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title={t('dashboard.todaySales')}
              value={`${money(summary.today.salesTotal)} ${t('common.sar')}`}
              sub={t('dashboard.invoicesCount', { count: summary.today.salesCount })}
              tone="success"
            />
            <KpiCard
              title={t('dashboard.inventoryValue')}
              value={`${money(summary.inventory.totalValue)} ${t('common.sar')}`}
              sub={
                summary.inventory.unvaluedStockLines > 0
                  ? t('dashboard.unvaluedItems', { count: summary.inventory.unvaluedStockLines })
                  : undefined
              }
              tone="brass"
            />
            <KpiCard
              title={t('dashboard.lowStockAlerts')}
              value={`${summary.inventory.lowStockCount}`}
              sub={summary.inventory.lowStockCount > 0 ? t('dashboard.clickToView') : undefined}
              tone={summary.inventory.lowStockCount > 0 ? 'danger' : 'default'}
              onClick={() => navigate('/inventory')}
            />
            <KpiCard
              title={t('dashboard.netProfitMonth')}
              value={`${money(summary.thisMonth.netProfit)} ${t('common.sar')}`}
              tone={summary.thisMonth.netProfit >= 0 ? 'success' : 'danger'}
            />
            <KpiCard
              title={t('dashboard.customerReceivables')}
              value={`${money(summary.receivables.totalCustomerBalance)} ${t('common.sar')}`}
            />
            <KpiCard
              title={t('dashboard.supplierPayables')}
              value={`${money(summary.payables.totalSupplierBalance)} ${t('common.sar')}`}
            />
            <KpiCard
              title={t('dashboard.cashAndBank')}
              value={`${money(summary.cashAndBank.totalBalance)} ${t('common.sar')}`}
            />
            <KpiCard
              title={t('dashboard.monthRevenue')}
              value={`${money(summary.thisMonth.revenueExclVat)} ${t('common.sar')}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-3">
              <h3 className="mb-4 font-bold text-gray-800">{t('dashboard.salesByBranch')}</h3>
              {branchSales.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.noSalesYet')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={branchSales} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis
                      type="category"
                      dataKey="branchName"
                      width={110}
                      tick={{ fontSize: 12, fill: '#374151' }}
                    />
                    <Tooltip
                      formatter={(value) => [`${money(Number(value ?? 0))} ${t('common.sar')}`, t('dashboard.total')]}
                      contentStyle={{ fontFamily: 'IBM Plex Sans Arabic', fontSize: 13 }}
                    />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {branchSales.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#0E6E6C' : '#7FBDB9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
              <h3 className="mb-4 font-bold text-gray-800">{t('dashboard.topSellingProducts')}</h3>
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.noSalesYet')}</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p) => (
                    <div key={p.product.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{p.product.name}</span>
                        <span className="figure text-gray-500">{p.quantity}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brass-500"
                          style={{ width: `${(p.quantity / maxTopQuantity) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
