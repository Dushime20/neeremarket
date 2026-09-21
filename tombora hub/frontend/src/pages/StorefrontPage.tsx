import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCategories, useProducts, useStore } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, ProductGridSkeleton, Rating } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import gridStyles from '@/components/product/ProductGrid.module.css';
import { getErrorMessage } from '@/api/client';
import browseStyles from './CategoryPage.module.css';
import styles from './StorefrontPage.module.css';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Recommend' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'best_rated', label: 'Best rated' },
  { value: 'discount', label: 'Discount' },
] as const;

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'USED', label: 'Used' },
  { value: 'REFURBISHED', label: 'Refurbished' },
] as const;

export function StorefrontPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    condition: true,
    stock: true,
  });

  const sort = searchParams.get('sort') || 'popular';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const condition = searchParams.get('condition') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const page = Number(searchParams.get('page') || '1') || 1;

  const { data: store, isLoading: storeLoading, isError: storeError, error: storeErr } =
    useStore(slug);
  const { data: allCategories } = useCategories();

  const productParams = useMemo(
    () => ({
      page,
      limit: 24,
      seller: slug,
      sort,
      ...(category ? { category } : {}),
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(condition ? { condition } : {}),
      ...(inStock ? { inStock: 'true' as const } : {}),
    }),
    [page, slug, sort, category, minPrice, maxPrice, condition, inStock],
  );

  const { data, isLoading, isError, error, isFetching } = useProducts(productParams);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function onPriceSubmit(e: FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const min = (form.elements.namedItem('minPrice') as HTMLInputElement).value.trim();
    const max = (form.elements.namedItem('maxPrice') as HTMLInputElement).value.trim();
    const next = new URLSearchParams(searchParams);
    if (min) next.set('minPrice', min);
    else next.delete('minPrice');
    if (max) next.set('maxPrice', max);
    else next.delete('maxPrice');
    next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (sort && sort !== 'popular') next.set('sort', sort);
    setSearchParams(next, { replace: true });
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const title = store?.name || 'Store';
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const activeFilterCount = [category, minPrice, maxPrice, condition, inStock ? '1' : ''].filter(
    Boolean,
  ).length;

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);
  const location = [store?.seller.marketLocation, store?.seller.district, store?.seller.province]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      {store ? (
        <section
          className={styles.cover}
          aria-label="Store cover"
          style={
            store.seller.coverUrl
              ? {
                  backgroundImage: `linear-gradient(120deg, rgba(26, 35, 50, 0.9), rgba(232, 93, 4, 0.5)), url('${store.seller.coverUrl}')`,
                }
              : undefined
          }
        >
          <div className={`container ${styles.coverInner}`}>
            <div className={styles.identity}>
              <h1>{store.name}</h1>
              <div className={styles.meta}>
                {store.seller.verificationStatus === 'VERIFIED' ? (
                  <Badge>Verified seller</Badge>
                ) : (
                  <Badge tone="muted">Unverified</Badge>
                )}
                <Rating value={store.seller.ratingAvg || 0} count={store.seller.ratingCount} />
              </div>
              {location ? <p>{location}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className={`container ${browseStyles.page}`}>
        <Helmet>
          <title>{store ? `${store.name} | NeereMarket` : 'Store | NeereMarket'}</title>
        </Helmet>

        <nav className={browseStyles.crumbs} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/stores">Stores</Link>
          <span>/</span>
          <span>{title}</span>
        </nav>

        {store?.seller.description ? (
          <p className={styles.storeDesc}>{store.seller.description}</p>
        ) : null}

        {storeError ? <Alert tone="error">{getErrorMessage(storeErr)}</Alert> : null}

        <div className={browseStyles.layout}>
          {filtersOpen ? (
            <button
              type="button"
              className={browseStyles.filterBackdrop}
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            />
          ) : null}
          <aside
            className={`${browseStyles.filters} ${filtersOpen ? browseStyles.filtersOpen : ''}`}
            aria-label="Product filters"
            aria-modal={filtersOpen || undefined}
            role={filtersOpen ? 'dialog' : undefined}
          >
            <div className={browseStyles.filterHead}>
              <h2>Filter</h2>
              <div className={browseStyles.filterHeadActions}>
                <button type="button" className={browseStyles.clearBtn} onClick={clearFilters}>
                  Clear
                </button>
                <button
                  type="button"
                  className={browseStyles.filterClose}
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className={browseStyles.filterBody}>
            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('category')}
                aria-expanded={openSections.category}
              >
                Category
                <span>{openSections.category ? '−' : '+'}</span>
              </button>
              {openSections.category ? (
                <ul className={`${browseStyles.checkList} ${browseStyles.categoryList}`}>
                  <li>
                    <button
                      type="button"
                      className={`${browseStyles.checkRow} ${!category ? browseStyles.checkOn : ''}`}
                      onClick={() => setParam('category', null)}
                    >
                      All categories
                    </button>
                  </li>
                  {(allCategories || []).map((item) => (
                    <li key={item.id}>
                      <label
                        className={`${browseStyles.checkRow} ${
                          category === item.slug ? browseStyles.checkOn : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={category === item.slug}
                          onChange={() =>
                            setParam('category', category === item.slug ? null : item.slug)
                          }
                        />
                        {item.name}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('price')}
                aria-expanded={openSections.price}
              >
                Price (RWF)
                <span>{openSections.price ? '−' : '+'}</span>
              </button>
              {openSections.price ? (
                <form className={browseStyles.priceForm} onSubmit={onPriceSubmit}>
                  <Input name="minPrice" label="Min" defaultValue={minPrice} inputMode="numeric" />
                  <Input name="maxPrice" label="Max" defaultValue={maxPrice} inputMode="numeric" />
                  <Button type="submit" size="sm" variant="secondary">
                    Apply
                  </Button>
                </form>
              ) : null}
            </section>

            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('condition')}
                aria-expanded={openSections.condition}
              >
                Condition
                <span>{openSections.condition ? '−' : '+'}</span>
              </button>
              {openSections.condition ? (
                <ul className={browseStyles.checkList}>
                  {CONDITIONS.map((item) => (
                    <li key={item.value}>
                      <label className={browseStyles.checkRow}>
                        <input
                          type="checkbox"
                          checked={condition === item.value}
                          onChange={() =>
                            setParam('condition', condition === item.value ? null : item.value)
                          }
                        />
                        {item.label}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className={browseStyles.filterSection}>
              <button
                type="button"
                className={browseStyles.sectionToggle}
                onClick={() => toggleSection('stock')}
                aria-expanded={openSections.stock}
              >
                Availability
                <span>{openSections.stock ? '−' : '+'}</span>
              </button>
              {openSections.stock ? (
                <label className={browseStyles.checkRow}>
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={() => setParam('inStock', inStock ? null : 'true')}
                  />
                  In stock only
                </label>
              ) : null}
            </section>
            </div>

            <div className={browseStyles.filterSheetFooter}>
              <Button type="button" onClick={() => setFiltersOpen(false)}>
                Show {total} result{total === 1 ? '' : 's'}
              </Button>
            </div>
          </aside>

          <div className={browseStyles.main}>
            <div className={browseStyles.toolbar}>
              <div>
                <h2 className={styles.productsTitle}>Products</h2>
                <p className={browseStyles.meta}>
                  {isLoading || storeLoading
                    ? 'Loading products…'
                    : `${total} product${total === 1 ? '' : 's'} in this store`}
                  {isFetching && !isLoading ? ' · Updating…' : ''}
                </p>
              </div>
              <div className={browseStyles.toolbarActions}>
                <button
                  type="button"
                  className={`${browseStyles.filterTrigger} ${
                    activeFilterCount ? browseStyles.filterTriggerActive : ''
                  }`}
                  onClick={() => setFiltersOpen(true)}
                >
                  Filter
                  {activeFilterCount ? (
                    <span className={browseStyles.filterCount}>{activeFilterCount}</span>
                  ) : null}
                </button>
                <label className={browseStyles.sort}>
                  <span>Sort by</span>
                  <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
            {isLoading || storeLoading ? <ProductGridSkeleton /> : null}
            {!isLoading && !storeLoading && data?.items.length === 0 ? (
              <EmptyState
                title="No products in this store"
                description="Try clearing filters or check back later."
                actionLabel="Clear filters"
                onAction={clearFilters}
              />
            ) : null}
            {data?.items.length ? (
              <ProductGrid products={data.items} className={gridStyles.dense} />
            ) : null}

            {totalPages > 1 ? (
              <div className={browseStyles.pager}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setParam('page', String(page - 1))}
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
                  onClick={() => setParam('page', String(page + 1))}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
