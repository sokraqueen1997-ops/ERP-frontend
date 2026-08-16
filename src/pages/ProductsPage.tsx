import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { ProductFormModal } from '../components/ProductFormModal';
import { deactivateProduct, fetchProducts, type Product } from '../api/products';

export function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  function money(n: string) {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n));
  }

  function load() {
    setLoading(true);
    fetchProducts(search ? { search } : {})
      .then(setProducts)
      .catch(() => setError(t('products.loadError')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 300); // debounce search typing
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function handleDeactivate(product: Product) {
    if (!confirm(t('products.confirmDeactivate', { name: product.name }))) return;
    try {
      await deactivateProduct(product.id);
      load();
    } catch {
      alert(t('products.deactivateError'));
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t('products.title')}</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('products.addButton')}
        </button>
      </div>

      <input
        type="text"
        placeholder={t('products.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-400">{t('common.loading')}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('products.colProduct')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('products.colCategory')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('products.colRetailPrice')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('products.colStatus')}</th>
                <th className="px-4 py-3 text-start font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {money(p.priceRetail)} {t('common.sar')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {p.isActive ? t('products.statusActive') : t('products.statusInactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {t('products.edit')}
                    </button>
                    {p.isActive && (
                      <button
                        onClick={() => handleDeactivate(p)}
                        className="ms-3 text-sm text-red-600 hover:underline"
                      >
                        {t('products.deactivate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    {t('products.noProducts')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        product={editingProduct}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </Layout>
  );
}
