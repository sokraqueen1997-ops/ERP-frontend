import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
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

// Odoo-inspired palette: the signature plum/purple as primary, with a
// small set of professional secondary tones for multi-series charts.
const ODOO_PURPLE = '#714B67';
const ODOO_PURPLE_LIGHT = '#9C6F94';
const ODOO_TEAL = '#00A09D';
const ODOO_AMBER = '#F0AD4E';
const ODOO_BLUE = '#4C6FE0';
const ODOO_GREEN = '#2ECC71';
const ODOO_RED = '#E74C3C';

function todayFormatted(locale: string) {
  return new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type Tone = 'purple' | 'danger' | 'success' | 'teal' | 'amber' | 'blue';

const TONE_HEX: Record<Tone, string> = {
  purple: ODOO_PURPLE,
  danger: ODOO_RED,
  success: ODOO_GREEN,
  teal: ODOO_TEAL,
  amber: ODOO_AMBER,
  blue: ODOO_BLUE,
};

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  tone?: Tone;
  onClick?: () => void;
}

function KpiCard({ title, value, sub, tone = 'purple', onClick }: KpiCardProps) {
  const accent = TONE_HEX[tone];
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      style={{ borderInlineStartColor: accent, borderInlineStartWidth: 4 }}
      className={`rounded-xl border border-gray-200 bg-white p-5 text-start shadow-sm ${
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="figure mt-2 text-2xl font-semibold text-gray-800">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </Wrapper>
  );
}

function ChartCard({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 font-bold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

const tooltipStyle = {
  fontFamily: 'IBM Plex Sans Arabic',
  fontSize: 13,
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
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
    return new Intl.NumberFormat(isAr ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  const financialData = summary
    ? [
        { name: t('dashboard.customerReceivables'), value: summary.receivables.totalCustomerBalance, color: ODOO_PURPLE },
        { name: t('dashboard.supplierPayables'), value: summary.payables.totalSupplierBalance, color: ODOO_AMBER },
        { name: t('dashboard.cashAndBank'), value: summary.cashAndBank.totalBalance, color: ODOO_TEAL },
      ].filter((d) => d.value > 0)
    : [];
  const financialTotal = financialData.reduce((sum, d) => sum + d.value, 0);

  const topProductsChartData = topProducts.map((p) => ({ name: p.product.name, quantity: p.quantity }));

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
              tone="purple"
            />
            <KpiCard
              title={t('dashboard.lowStockAlerts')}
              value={`${summary.inventory.lowStockCount}`}
              sub={summary.inventory.lowStockCount > 0 ? t('dashboard.clickToView') : undefined}
              tone={summary.inventory.lowStockCount > 0 ? 'danger' : 'teal'}
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
              tone="purple"
            />
            <KpiCard
              title={t('dashboard.supplierPayables')}
              value={`${money(summary.payables.totalSupplierBalance)} ${t('common.sar')}`}
              tone="amber"
            />
            <KpiCard
              title={t('dashboard.cashAndBank')}
              value={`${money(summary.cashAndBank.totalBalance)} ${t('common.sar')}`}
              tone="teal"
            />
            <KpiCard
              title={t('dashboard.monthRevenue')}
              value={`${money(summary.thisMonth.revenueExclVat)} ${t('common.sar')}`}
              tone="blue"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title={t('dashboard.salesByBranch')} className="lg:col-span-1">
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
                      width={100}
                      tick={{ fontSize: 12, fill: '#374151' }}
                    />
                    <Tooltip
                      formatter={(value) => [`${money(Number(value ?? 0))} ${t('common.sar')}`, t('dashboard.total')]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {branchSales.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? ODOO_PURPLE : ODOO_PURPLE_LIGHT} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={t('dashboard.topSellingProducts')} className="lg:col-span-1">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.noSalesYet')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProductsChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: '#374151' }}
                    />
                    <Tooltip
                      formatter={(value) => [String(value), isAr ? 'الكمية المباعة' : 'Qty sold']}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="quantity" radius={[0, 6, 6, 0]} fill={ODOO_TEAL} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={isAr ? 'نظرة مالية عامة' : 'Financial Overview'} className="lg:col-span-1">
              {financialData.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.noSalesYet')}</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={financialData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {financialData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${money(Number(value ?? 0))} ${t('common.sar')}`}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-2">
                    {financialData.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-gray-600">{entry.name}</span>
                        </div>
                        <span className="figure font-medium text-gray-700">
                          {financialTotal > 0 ? Math.round((entry.value / financialTotal) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </Layout>
  );
}
