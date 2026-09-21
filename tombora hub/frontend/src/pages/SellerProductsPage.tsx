import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDeleteProduct, useMe, useSellerProducts, useUpdateProduct } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import { variantLabel } from '@/utils/variant';
import { categoryPath } from '@/utils/category';
import styles from './workspace.module.css';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'ACTIVE', label: 'Live' },
  { id: 'PENDING_APPROVAL', label: 'In review' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'OUT_OF_STOCK', label: 'Out of stock' },
  { id: 'ARCHIVED', label: 'Off market' },
];

export function SellerProductsPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, error } = useSellerProducts(status || undefined, q || undefined);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function unpublish(id: string, name: string) {
    if (!window.confirm(`Remove “${name}” from the marketplace? Shoppers will no longer see it.`)) return;
    setActionError(null);
    setBanner(null);
    setBusyId(id);
    try {
      await updateProduct.mutateAsync({ id, unpublish: true });
      setBanner(`“${name}” was removed from the market.`);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not remove listing from the market'));
    } finally {
      setBusyId(null);
    }
  }

  async function relist(id: string, name: string) {
    setActionError(null);
    setBanner(null);
    setBusyId(id);
    try {
      await updateProduct.mutateAsync({ id, relist: true });
      setBanner(`“${name}” was submitted to go back on the market.`);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not relist product'));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete “${name}”? This cannot be undone from the catalog.`)) return;
    setActionError(null);
    setBanner(null);
    setBusyId(id);
    try {
      await deleteProduct.mutateAsync(id);
      setBanner(`“${name}” was deleted.`);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete product'));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller/products')}
        />
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Catalog | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Catalog</p>
          <h1>Listings</h1>
          <p>
            {data?.pagination.total ?? 0} products
            {q ? ` matching “${q}”` : ' in this view'}
          </p>
        </div>
        <Link to="/seller/products/new">
          <Button type="button" size="sm">
            Add product
          </Button>
        </Link>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.filters} role="tablist" aria-label="Product status">
            {FILTERS.map((f) => (
              <button
                key={f.id || 'all'}
                type="button"
                className={`${styles.chip} ${status === f.id ? styles.chipOn : ''}`}
                onClick={() => setStatus(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {banner ? (
          <div className={styles.panelBody}>
            <Alert tone="success">{banner}</Alert>
          </div>
        ) : null}
        {actionError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{actionError}</Alert>
          </div>
        ) : null}
        {isLoading ? (
          <div className={styles.panelBody}>
            <TableSkeleton />
          </div>
        ) : null}
        {isError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{getErrorMessage(error)}</Alert>
          </div>
        ) : null}
        {!isLoading && !data?.items.length ? (
          <div className={styles.panelBody}>
            <EmptyState
              compact
              title="No products in this filter"
              description="Add a listing or switch status to see more of your catalog."
              actionLabel="Add product"
              onAction={() => navigate('/seller/products/new')}
            />
          </div>
        ) : null}
        {data?.items.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => {
                  const rowStatus = p.status;
                  const variants = p.variants || [];
                  const out = variants.filter((v) => (v.inventory?.available ?? v.inventory?.quantity ?? 0) <= 0)
                    .length;
                  const units = variants.reduce(
                    (sum, v) => sum + (v.inventory?.available ?? v.inventory?.quantity ?? 0),
                    0,
                  );
                  const stockLabel = variants.length
                    ? out
                      ? `${out} of ${variants.length} out`
                      : `${units} available`
                    : '—';
                  const live = rowStatus === 'ACTIVE' || rowStatus === 'OUT_OF_STOCK';
                  const offMarket = rowStatus === 'ARCHIVED' || rowStatus === 'DRAFT';
                  const rowBusy = busyId === p.id;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.item}>
                          {p.images?.[0]?.url ? (
                            <img className={styles.thumb} src={p.images[0].url} alt="" />
                          ) : (
                            <span className={styles.thumb} />
                          )}
                          <span>
                            <strong>{p.name}</strong>
                            <small>
                              {variants.length
                                ? variants
                                    .slice(0, 3)
                                    .map((v) => variantLabel(v.name, v.attributes))
                                    .join(', ')
                                : p.slug}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>{categoryPath(p.category)}</td>
                      <td className={styles.num}>{formatRwf(p.discountPrice || p.price)}</td>
                      <td>
                        <Badge tone={out ? 'danger' : units <= variants.length * 2 ? 'warning' : 'success'}>
                          {stockLabel}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={statusTone(rowStatus)}>{prettyStatus(rowStatus)}</Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link to={`/seller/products/${p.id}`}>
                            <Button type="button" size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
                          <Link to={`/seller/products/${p.id}/edit`}>
                            <Button type="button" size="sm" variant="secondary">
                              Edit
                            </Button>
                          </Link>
                          {live ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={rowBusy}
                              onClick={() => void unpublish(p.id, p.name)}
                            >
                              {rowBusy ? '…' : 'Remove from market'}
                            </Button>
                          ) : null}
                          {offMarket ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={rowBusy}
                              onClick={() => void relist(p.id, p.name)}
                            >
                              {rowBusy ? '…' : 'Relist'}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            disabled={rowBusy}
                            onClick={() => void remove(p.id, p.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
