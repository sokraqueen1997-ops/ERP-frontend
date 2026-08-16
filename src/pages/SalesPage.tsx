import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { fetchCustomers, createCustomer, type Customer } from '../api/customers';
import { fetchBranches, type Branch } from '../api/branches';
import { fetchWarehouses, type Warehouse } from '../api/warehouses';
import { fetchProducts, type Product } from '../api/products';
import { createSale, openInvoiceInNewTab, type Sale } from '../api/sales';
import { ApiError } from '../api/client';
import { buildWhatsAppLink } from '../utils/whatsapp';

const PRICE_FIELD_BY_TYPE: Record<string, keyof Product> = {
  RETAIL: 'priceRetail',
  WHOLESALE: 'priceWholesale',
  CONTRACTOR: 'priceContractor',
  PROJECT: 'priceProject',
};

interface CartLine {
  product: Product;
  quantity: number;
}

export function SalesPage() {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const PAYMENT_METHODS = [
    { value: 'CASH', label: t('sales.paymentCash') },
    { value: 'CARD', label: t('sales.paymentCard') },
    { value: 'BANK_TRANSFER', label: t('sales.paymentBankTransfer') },
    { value: 'CREDIT', label: t('sales.paymentCredit') },
  ];

  function money(n: number) {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }

  useEffect(() => {
    fetchCustomers().then((all) => setCustomers(all.filter((c) => c.isActive)));
    fetchBranches().then(setBranches);
    fetchWarehouses().then(setWarehouses);
  }, []);

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

  const warehousesForBranch = useMemo(
    () => warehouses.filter((w) => w.branchId === branchId),
    [warehouses, branchId],
  );

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const priceField = selectedCustomer ? PRICE_FIELD_BY_TYPE[selectedCustomer.customerType] : 'priceRetail';

  const filteredCustomers = customerSearch.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(customerSearch.trim().toLowerCase()))
    : customers;
  const customerExactMatch = customers.some(
    (c) => c.name.trim().toLowerCase() === customerSearch.trim().toLowerCase(),
  );

  function selectCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setCustomerSearch('');
    setCustomerDropdownOpen(false);
  }

  function clearCustomer() {
    setCustomerId('');
    setCustomerSearch('');
  }

  async function handleCreateWalkInCustomer() {
    const name = customerSearch.trim();
    if (!name) return;
    setCreatingCustomer(true);
    setError(null);
    try {
      const newCustomer = await createCustomer({ name });
      setCustomers((prev) => [...prev, newCustomer]);
      setCustomerId(newCustomer.id);
      setCustomerSearch('');
      setCustomerDropdownOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('sales.customerAddError'));
    } finally {
      setCreatingCustomer(false);
    }
  }

  const cartLines = cart.map((line) => {
    const unitPrice = Number(line.product[priceField]);
    const lineSubtotal = unitPrice * line.quantity;
    const vatRate = Number(line.product.vatRate);
    const lineVat = line.product.isVatApplicable ? lineSubtotal * (vatRate / 100) : 0;
    return { ...line, unitPrice, lineSubtotal, lineVat, lineTotal: lineSubtotal + lineVat };
  });

  const subtotal = cartLines.reduce((sum, l) => sum + l.lineSubtotal, 0);
  const vatTotal = cartLines.reduce((sum, l) => sum + l.lineVat, 0);
  const discount = Number(discountAmount) || 0;
  const grandTotal = subtotal - discount + vatTotal;

  function handleBranchChange(newBranchId: string) {
    setBranchId(newBranchId);
    setWarehouseId('');
  }

  function addProduct(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch('');
    setProductResults([]);
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    setCart((prev) => prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l)));
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function resetForm() {
    setCart([]);
    setDiscountAmount('0');
    setNotes('');
    setCompletedSale(null);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    if (!customerId || !branchId || !warehouseId) {
      setError(t('sales.selectCustomerBranchWarehouse'));
      return;
    }
    if (cart.length === 0) {
      setError(t('sales.addAtLeastOneItem'));
      return;
    }

    setSubmitting(true);
    try {
      const sale = await createSale({
        customerId,
        branchId,
        warehouseId,
        paymentMethod,
        discountAmount: discount || undefined,
        notes: notes || undefined,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      setCompletedSale(sale);
      setCart([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('sales.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  if (completedSale) {
    const waMessage = t('sales.whatsappMessage', {
      name: selectedCustomer?.name ?? '',
      invoiceNumber: completedSale.invoiceNumber,
      amount: money(Number(completedSale.totalAmount)),
    });
    const waLink = buildWhatsAppLink(selectedCustomer?.phone, waMessage);

    return (
      <Layout>
        <div className="mx-auto max-w-md rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <h2 className="mb-1 text-lg font-bold text-gray-800">{t('sales.successTitle')}</h2>
          <p className="mb-6 text-2xl font-bold text-green-700">{completedSale.invoiceNumber}</p>
          <p className="mb-6 text-sm text-gray-600">
            {t('sales.invoiceTotal')} {money(Number(completedSale.totalAmount))} {t('common.sar')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => openInvoiceInNewTab(completedSale.id)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('sales.viewPrintInvoice')}
            </button>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {t('sales.sendWhatsApp')}
              </a>
            )}
            <button
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('sales.newInvoice')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="mb-6 text-xl font-bold text-gray-800">{t('sales.title')}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: order details + cart */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="relative">
              <label className={labelClass}>{t('sales.customer')} *</label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <span className="text-gray-800">{selectedCustomer.name}</span>
                  <button type="button" onClick={clearCustomer} className="text-xs text-gray-400 hover:text-gray-600">
                    {t('sales.changeCustomer')} ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={t('sales.customerSearchPlaceholder')}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => setCustomerDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 150)}
                    className={inputClass}
                  />
                  {customerDropdownOpen && (
                    <div className="absolute inset-x-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => selectCustomer(c)}
                          className="block w-full px-3 py-2 text-start text-sm hover:bg-gray-50"
                        >
                          {c.name}
                        </button>
                      ))}
                      {customerSearch.trim() && !customerExactMatch && (
                        <button
                          type="button"
                          onMouseDown={handleCreateWalkInCustomer}
                          disabled={creatingCustomer}
                          className="block w-full border-t border-gray-100 px-3 py-2 text-start text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        >
                          {creatingCustomer
                            ? t('sales.addingCustomer')
                            : t('sales.addNewCustomer', { name: customerSearch.trim() })}
                        </button>
                      )}
                      {filteredCustomers.length === 0 && !customerSearch.trim() && (
                        <p className="px-3 py-2 text-sm text-gray-400">{t('sales.typeToSearchCustomer')}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <label className={labelClass}>{t('sales.branch')} *</label>
              <select className={inputClass} value={branchId} onChange={(e) => handleBranchChange(e.target.value)}>
                <option value="">{t('sales.selectBranch')}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('sales.warehouse')} *</label>
              <select
                className={inputClass}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={!branchId}
              >
                <option value="">{t('sales.selectWarehouse')}</option>
                {warehousesForBranch.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative rounded-xl border border-gray-200 bg-white p-4">
            <label className={labelClass}>{t('sales.addItem')}</label>
            <input
              type="text"
              placeholder={t('sales.itemSearchPlaceholder')}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className={inputClass}
            />
            {productResults.length > 0 && (
              <div className="absolute inset-x-4 z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
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
                    <span className="text-gray-500">
                      {money(Number(p[priceField]))} {t('common.sar')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('sales.colItem')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('sales.colQuantity')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('sales.colPrice')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('sales.colTotal')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cartLines.map((l) => (
                  <tr key={l.product.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{l.product.name}</p>
                      <p className="text-xs text-gray-400">{l.product.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={l.quantity}
                        onChange={(e) => updateQuantity(l.product.id, Number(e.target.value))}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{money(l.unitPrice)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{money(l.lineTotal)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeLine(l.product.id)} className="text-red-500 hover:text-red-700">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {cartLines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      {t('sales.noItemsYet')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: totals + payment + submit */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className={labelClass}>{t('sales.paymentMethod')}</label>
            <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <label className={`${labelClass} mt-4`}>{t('sales.discount')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />

            <label className={`${labelClass} mt-4`}>{t('sales.notes')}</label>
            <textarea rows={2} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{t('sales.subtotal')}</span>
              <span>
                {money(subtotal)} {t('common.sar')}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t('sales.discount')}</span>
              <span>
                {money(discount)} {t('common.sar')}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t('sales.vat')}</span>
              <span>
                {money(vatTotal)} {t('common.sar')}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-800">
              <span>{t('dashboard.total')}</span>
              <span>
                {money(grandTotal)} {t('common.sar')}
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? t('sales.submitting') : t('sales.submit')}
          </button>
        </div>
      </div>
    </Layout>
  );
}
