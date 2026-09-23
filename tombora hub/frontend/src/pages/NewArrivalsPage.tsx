import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCategories, useProducts } from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import gridStyles from '@/components/product/ProductGrid.module.css';
import { getErrorMessage } from '@/api/client';
import { pageTitle } from '@/config/brand';
import infoStyles from './InfoPages.module.css';
import styles from './NewArrivalsPage.module.css';

export function NewArrivalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || '1') || 1;
  const category = searchParams.get('category') || '';
  const { data: categories } = useCategories();

  const productParams = useMemo(
    () => ({
      page,
      limit: 24,
      sort: 'newest',
      ...(category ? { category } : {}),
    }),
    [page, category],
  );

  const { data, isLoading, isError, error, isFetching } = useProducts(productParams);
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const topCategories = (categories || []).filter((item) => !item.parentId).slice(0, 12);

  function setCategory(slug: string) {
    const next = new URLSearchParams(searchParams);
    if (!slug || slug === category) next.delete('category');
    else next.set('category', slug);
    next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, category]);

  return (
    <div className={infoStyles.page}>
      <Helmet>
        <title>{pageTitle('New arrivals')}</title>
      </Helmet>
      <section className={infoStyles.hero}>
        <div className="container">
          <p className={infoStyles.kicker}>Just listed</p>
          <h1>New arrivals in Rwanda</h1>
          <p>The latest products from verified stores — newest first, priced in RWF.</p>
        </div>
      </section>

      <div className={`container ${styles.body}`}>
        {topCategories.length ? (
          <div className={styles.chips} role="tablist" aria-label="Filter by category">
            <button
              type="button"
              className={!category ? styles.chipActive : styles.chip}
              onClick={() => setCategory('')}
            >
              All
            </button>
            {topCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={category === item.slug ? styles.chipActive : styles.chip}
                onClick={() => setCategory(item.slug)}
              >
                {item.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.toolbar}>
          <p className={styles.meta}>
            {isLoading
              ? 'Loading new listings…'
              : `${total} new arrival${total === 1 ? '' : 's'}`}
            {isFetching && !isLoading ? ' · Updating…' : ''}
          </p>
          <Link to="/products" className={styles.browseAll}>
            Browse all products
          </Link>
        </div>

        {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
        {isLoading ? <ProductGridSkeleton /> : null}
        {!isLoading && data?.items.length === 0 ? (
          <EmptyState
            title="No new arrivals yet"
            description="Fresh listings will show here as sellers publish products."
            actionLabel="Browse the market"
            onAction={() => navigate('/products')}
          />
        ) : null}
        {data?.items.length ? (
          <ProductGrid products={data.items} className={gridStyles.dense} />
        ) : null}

        {totalPages > 1 ? (
          <div className={styles.pager}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
