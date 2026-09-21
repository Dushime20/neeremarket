import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDeleteProduct, useSellerProduct, useUpdateProduct } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, TableSkeleton } from '@/components/ui';
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
    if (!window.confirm(`Remove “${product.name}” from the marketplace?`)) return;
    setActionError(null);
    try {
      await updateProduct.mutateAsync({ id: product.id, unpublish: true });
      setMessage('Listing was removed from the market.');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not remove listing from the market'));
    }
  }

  async function relist() {
    if (!product) return;
    setActionError(null);
    try {
      await updateProduct.mutateAsync({ id: product.id, relist: true });
      setMessage('Listing was submitted to go back on the market.');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not relist product'));
    }
  }

  async function remove() {
    if (!product) return;
    if (!window.confirm(`Delete “${product.name}”?`)) return;
    setActionError(null);
    try {
      await deleteProduct.mutateAsync(product.id);
      navigate('/seller/products');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete product'));
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

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Catalog</p>
          <h1>{product.name}</h1>
          <div className={styles.pageMeta}>
            <Badge tone={statusTone(product.status)}>{prettyStatus(product.status)}</Badge>
            <span className={styles.muted}>{categoryPath(product.category)}</span>
            {product.sku ? <span className={styles.muted}>SKU {product.sku}</span> : null}
          </div>
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
      </header>

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
