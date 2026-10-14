import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDeleteProduct, useSellerProduct, useUpdateProduct } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, TableSkeleton, useConfirm, useToast } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import { variantLabel } from '@/utils/variant';
import { categoryPath } from '@/utils/category';
import { useState } from 'react';
import styles from './workspace.module.css';

export function SellerProductDetailPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { data: product, isLoading, isError, error } = useSellerProduct(productId);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const live = product?.status === 'ACTIVE' || product?.status === 'OUT_OF_STOCK';
  const offMarket =
    product?.status === 'ARCHIVED' || product?.status === 'DRAFT' || product?.status === 'REJECTED';

  async function unpublish() {
    if (!product) return;
    const ok = await confirm({
      title: 'Remove from marketplace',
      message: `Remove “${product.name}” from the marketplace? Shoppers will no longer see it.`,
      confirmText: 'Remove listing',
      tone: 'warning',
    });
    if (!ok) return;

    setActionError(null);
    try {
      await updateProduct.mutateAsync({ id: product.id, unpublish: true });
      const msg = 'Listing was removed from the market.';
      setMessage(msg);
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not remove listing from the market');
      setActionError(msg);
      toast.error(msg);
    }
  }

  async function relist() {
    if (!product) return;
    setActionError(null);
    try {
      await updateProduct.mutateAsync({ id: product.id, relist: true });
      const msg = 'Listing was submitted to go back on the market.';
      setMessage(msg);
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not relist product');
      setActionError(msg);
      toast.error(msg);
    }
  }

  async function remove() {
    if (!product) return;
    const ok = await confirm({
      title: 'Delete product',
      message: `Delete “${product.name}”? This cannot be undone from the catalog.`,
      confirmText: 'Delete permanently',
      tone: 'danger',
    });
    if (!ok) return;

    setActionError(null);
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success(`“${product.name}” was deleted.`);
      navigate('/seller/products');
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not delete product');
      setActionError(msg);
      toast.error(msg);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.stack}>
        <TableSkeleton />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Listing not found"
          description={getErrorMessage(error, 'This product is missing or was deleted.')}
          actionLabel="Back to catalog"
          onAction={() => navigate('/seller/products')}
        />
      </div>
    );
  }

  const specs = product.specifications || [];
  const images = product.images || [];
  const variants = product.variants || [];

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>{product.name} | Catalog</title>
      </Helmet>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Badge tone={statusTone(product.status)}>{prettyStatus(product.status)}</Badge>
          <span className={styles.muted} style={{ fontSize: 'var(--text-xs)' }}>{categoryPath(product.category)}</span>
          {product.sku ? <span className={styles.muted} style={{ fontSize: 'var(--text-xs)' }}>• SKU {product.sku}</span> : null}
        </div>
        <div className={styles.actions}>
          {live ? (
            <Link to={`/products/${product.slug}`} target="_blank" rel="noreferrer">
              <Button type="button" size="sm" variant="ghost">
                View on market
              </Button>
            </Link>
          ) : null}
          <Link to={`/seller/products/${product.id}/edit`}>
            <Button type="button" size="sm">
              Edit
            </Button>
          </Link>
          {live ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => void unpublish()}>
              Remove from market
            </Button>
          ) : null}
          {offMarket ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => void relist()}>
              Relist
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="danger" onClick={() => void remove()}>
            Delete
          </Button>
        </div>
      </div>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}

      <div className={styles.split}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Gallery</h2>
          </div>
          <div className={styles.panelBody}>
            {images.length ? (
              <div className={styles.detailGallery}>
                {images.map((img) => (
                  <img key={img.url} src={img.url} alt={img.altText || product.name} />
                ))}
              </div>
            ) : (
              <p className={styles.muted}>No gallery photos yet.</p>
            )}
            {product.videos?.length ? (
              <ul className={styles.videoLinks}>
                {product.videos.map((video) => (
                  <li key={video.url}>
                    <a href={video.url} target="_blank" rel="noreferrer">
                      {video.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Pricing</h2>
          </div>
          <div className={styles.panelBody}>
            <p className={styles.detailPrice}>{formatRwf(product.discountPrice || product.price)}</p>
            {product.discountPrice ? (
              <p className={styles.muted}>Was {formatRwf(product.price)}</p>
            ) : null}
            <p className={styles.muted}>{prettyStatus(product.condition || 'NEW')}</p>
            {product.shortDescription ? <p>{product.shortDescription}</p> : null}
            <p className={styles.muted}>{product.description || 'No description yet.'}</p>
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Specifications</h2>
        </div>
        {specs.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                {specs.map((row) => (
                  <tr key={`${row.name}-${row.value}`}>
                    <th>{row.name}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
                {product.weightGrams ? (
                  <tr>
                    <th>Weight</th>
                    <td>{product.weightGrams} g</td>
                  </tr>
                ) : null}
                {product.lengthMm || product.widthMm || product.heightMm ? (
                  <tr>
                    <th>Dimensions</th>
                    <td>
                      {[product.lengthMm, product.widthMm, product.heightMm]
                        .filter(Boolean)
                        .map((mm) => `${Math.round(Number(mm) / 10)} cm`)
                        .join(' × ')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.panelBody}>
            <p className={styles.muted}>No specifications added.</p>
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Variants</h2>
          <Link to={`/seller/inventory?q=${encodeURIComponent(product.name)}`}>Manage stock</Link>
        </div>
        {variants.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Option</th>
                  <th>SKU</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id}>
                    <td>{variantLabel(v.name, v.attributes)}</td>
                    <td>{v.sku}</td>
                    <td>{v.inventory?.available ?? v.inventory?.quantity ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.panelBody}>
            <p className={styles.muted}>No variants.</p>
          </div>
        )}
      </section>
    </div>
  );
}
