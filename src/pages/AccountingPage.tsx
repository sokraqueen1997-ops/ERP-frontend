import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { AccountFormModal } from '../components/AccountFormModal';
import { VoucherModal } from '../components/VoucherModal';
import { AccountLedgerModal } from '../components/AccountLedgerModal';
import {
  fetchAccounts,
  fetchProfitLoss,
  fetchVatReport,
  fetchAgingReport,
  type Account,
  type ProfitLossReport,
  type VatReport,
  type AgingReport,
} from '../api/accounting';
import { buildWhatsAppLink } from '../utils/whatsapp';

function money(n: number | string) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AccountingPage() {
  const [tab, setTab] = useState<'accounts' | 'reports' | 'aging'>('accounts');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [voucherAccount, setVoucherAccount] = useState<Account | null>(null);
  const [voucherKind, setVoucherKind] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [ledgerAccount, setLedgerAccount] = useState<Account | null>(null);

  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [pl, setPl] = useState<ProfitLossReport | null>(null);
  const [vat, setVat] = useState<VatReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [aging, setAging] = useState<AgingReport | null>(null);
  const [agingLoading, setAgingLoading] = useState(false);
  const [agingError, setAgingError] = useState<string | null>(null);

  function loadAccounts() {
    setLoading(true);
    fetchAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false));
  }

  useEffect(loadAccounts, []);

  function loadReports() {
    setReportLoading(true);
    setReportError(null);
    const fromIso = new Date(from).toISOString();
    const toIso = new Date(to + 'T23:59:59').toISOString();
    Promise.all([fetchProfitLoss(fromIso, toIso), fetchVatReport(fromIso, toIso)])
      .then(([plRes, vatRes]) => {
        setPl(plRes);
        setVat(vatRes);
      })
      .catch(() => setReportError('تعذّر تحميل التقارير'))
      .finally(() => setReportLoading(false));
  }

  useEffect(() => {
    if (tab === 'reports' && !pl) loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function loadAging() {
    setAgingLoading(true);
    setAgingError(null);
    fetchAgingReport()
      .then(setAging)
      .catch(() => setAgingError('تعذّر تحميل تقرير أعمار الديون'))
      .finally(() => setAgingLoading(false));
  }

  useEffect(() => {
    if (tab === 'aging' && !aging) loadAging();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function openVoucher(account: Account, kind: 'RECEIPT' | 'PAYMENT') {
    setVoucherAccount(account);
    setVoucherKind(kind);
  }

  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <Layout>
      <h1 className="mb-6 text-xl font-bold text-gray-800">المحاسبة</h1>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('accounts')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'accounts' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
          }`}
        >
          الحسابات
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'reports' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
          }`}
        >
          التقارير
        </button>
        <button
          onClick={() => setTab('aging')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'aging' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
          }`}
        >
          أعمار الديون
        </button>
      </div>

      {tab === 'accounts' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                setEditingAccount(null);
                setFormOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + حساب جديد
            </button>
          </div>

          {loading && <p className="text-gray-400">جارِ التحميل...</p>}

          {!loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.type === 'CASH' ? 'صندوق نقدي' : 'حساب بنكي'}</p>
                    </div>
                    {!a.isActive && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">معطّل</span>
                    )}
                  </div>
                  <p className="mb-4 text-2xl font-bold text-gray-800">{money(a.balance)} ر.س</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => openVoucher(a, 'RECEIPT')}
                      className="rounded-lg bg-green-50 px-3 py-1.5 font-medium text-green-700 hover:bg-green-100"
                    >
                      سند قبض
                    </button>
                    <button
                      onClick={() => openVoucher(a, 'PAYMENT')}
                      className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
                    >
                      سند صرف
                    </button>
                    <button
                      onClick={() => setLedgerAccount(a)}
                      className="rounded-lg bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                    >
                      كشف حساب
                    </button>
                    <button
                      onClick={() => {
                        setEditingAccount(a);
                        setFormOpen(true);
                      }}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100"
                    >
                      تعديل
                    </button>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="col-span-full py-8 text-center text-gray-400">لا توجد حسابات بعد</p>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'reports' && (
        <>
          <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">من تاريخ</label>
              <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">إلى تاريخ</label>
              <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button
              onClick={loadReports}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              عرض التقارير
            </button>
          </div>

          {reportLoading && <p className="text-gray-400">جارِ التحميل...</p>}
          {reportError && <p className="text-red-600">{reportError}</p>}

          {!reportLoading && pl && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-bold text-gray-800">الأرباح والخسائر</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
                <div className="text-gray-500">المبيعات (شامل الضريبة)</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(pl.revenueInclVat)} ر.س</div>
                <div className="text-gray-500">المرتجعات</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(pl.returnsInclVat)} ر.س</div>
                <div className="text-gray-500">الإيراد (بدون ضريبة)</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(pl.revenueExclVat)} ر.س</div>
                <div className="text-gray-500">تكلفة البضاعة المباعة</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(pl.cogs)} ر.س</div>
                <div className="text-gray-500">مجمل الربح</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(pl.grossProfit)} ر.س</div>
                <div className="text-gray-500">إجمالي المصروفات</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(pl.totalExpenses)} ر.س</div>
                <div className="border-t border-gray-100 pt-2 font-bold text-gray-800">صافي الربح</div>
                <div
                  className={`border-t border-gray-100 pt-2 font-bold sm:col-span-2 ${
                    pl.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {money(pl.netProfit)} ر.س
                </div>
              </div>
              {pl.notes.length > 0 && (
                <ul className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-amber-700">
                  {pl.notes.map((n, i) => (
                    <li key={i}>⚠️ {n}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!reportLoading && vat && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-bold text-gray-800">ضريبة القيمة المضافة</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
                <div className="text-gray-500">ضريبة المبيعات (مخرجات)</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(vat.outputVat)} ر.س</div>
                <div className="text-gray-500">ضريبة المشتريات (مدخلات)</div>
                <div className="font-medium text-gray-800 sm:col-span-2">{money(vat.inputVat)} ر.س</div>
                <div className="border-t border-gray-100 pt-2 font-bold text-gray-800">صافي المستحق</div>
                <div className="border-t border-gray-100 pt-2 font-bold text-gray-800 sm:col-span-2">
                  {money(vat.netVatPayable)} ر.س
                </div>
              </div>
              <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">{vat.note}</p>
            </div>
          )}
        </>
      )}

      {tab === 'aging' && (
        <>
          {agingLoading && <p className="text-gray-400">جارِ التحميل...</p>}
          {agingError && <p className="text-red-600">{agingError}</p>}

          {!agingLoading && aging && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {aging.buckets.map((b) => {
                  const colors: Record<string, string> = {
                    '0-30': 'border-green-200 bg-green-50 text-green-700',
                    '31-60': 'border-amber-200 bg-amber-50 text-amber-700',
                    '61-90': 'border-orange-200 bg-orange-50 text-orange-700',
                    '90+': 'border-red-200 bg-red-50 text-red-700',
                  };
                  return (
                    <div key={b.label} className={`rounded-xl border p-4 ${colors[b.label]}`}>
                      <p className="text-xs font-medium">{b.label} يوم</p>
                      <p className="mt-1 text-xl font-bold">{money(b.total)} ر.س</p>
                      <p className="mt-1 text-xs opacity-75">{b.customerCount} عميل</p>
                    </div>
                  );
                })}
              </div>

              <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">إجمالي المستحقات</p>
                <p className="text-2xl font-bold text-gray-800">{money(aging.totalOutstanding)} ر.س</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">العميل</th>
                      <th className="px-4 py-3 text-start font-medium">الرصيد المستحق</th>
                      <th className="px-4 py-3 text-start font-medium">عدد الأيام</th>
                      <th className="px-4 py-3 text-start font-medium">الفئة</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {aging.customers.map((c) => {
                      const reminderMessage =
                        'مرحبًا ' +
                        c.customerName +
                        '، نود تذكيركم بوجود مبلغ مستحق قدره ' +
                        money(c.balance) +
                        ' ريال. نرجو التكرم بالسداد في أقرب وقت ممكن. شكرًا لتفهمكم.';
                      const waLink = buildWhatsAppLink(c.phone, reminderMessage);
                      return (
                        <tr key={c.customerId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{c.customerName}</p>
                            <p className="text-xs text-gray-400">{c.phone ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{money(c.balance)} ر.س</td>
                          <td className="px-4 py-3 text-gray-600">{c.daysOutstanding} يوم</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {c.bucket}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-end">
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-700 hover:underline"
                              >
                                تذكير واتساب
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {aging.customers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          لا توجد مستحقات حاليًا 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs text-gray-400">{aging.note}</p>
            </>
          )}
        </>
      )}

      <AccountFormModal open={formOpen} account={editingAccount} onClose={() => setFormOpen(false)} onSaved={loadAccounts} />
      <VoucherModal
        open={voucherAccount !== null}
        kind={voucherKind}
        account={voucherAccount}
        onClose={() => setVoucherAccount(null)}
        onSaved={loadAccounts}
      />
      <AccountLedgerModal open={ledgerAccount !== null} account={ledgerAccount} onClose={() => setLedgerAccount(null)} />
    </Layout>
  );
}
