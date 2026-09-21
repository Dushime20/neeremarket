import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCategories, useCategory, useProducts } from '@/api/hooks';
import { Alert, Button, EmptyState, Input, ProductGridSkeleton } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import gridStyles from '@/components/product/ProductGrid.module.css';
import { getErrorMessage } from '@/api/client';
import styles from './CategoryPage.module.css';

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

export function CategoryPage() {
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
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const condition = searchParams.get('condition') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const page = Number(searchParams.get('page') || '1') || 1;

  const { data: category, isLoading: categoryLoading, isError: categoryError, error: categoryErr } =
    useCategory(slug);
  const { data: allCategories } = useCategories();

  const productParams = useMemo(
    () => ({
      page,
      limit: 24,
      category: slug,
      sort,
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(condition ? { condition } : {}),
      ...(inStock ? { inStock: 'true' as const } : {}),
    }),
    [page, slug, sort, minPrice, maxPrice, condition, inStock],
  );

  const { data, isLoading, isError, error, isFetching } = useProducts(productParams);

  const parent = category?.parent ?? null;
  const siblings =
    parent && allCategories
      ? allCategories.find((c) => c.id === parent.id)?.children || []
      : [];
  const filterCategories = category?.children?.length
    ? category.children
    : siblings.length
      ? siblings
      : (allCategories || []).slice(0, 12);

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

  const title = category?.name || 'Category';
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const activeFilterCount = [minPrice, maxPrice, condition, inStock ? '1' : ''].filter(Boolean).length;

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

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{title} | NeereMarket</title>
      </Helmet>

      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/categories">Categories</Link>
        {parent ? (
          <>
            <span>/</span>
            <Link to={`/categories/${parent.slug}`}>{parent.name}</Link>
          </>
        ) : null}
        <span>/</span>
        <span>{title}</span>
      </nav>

      <div className={styles.layout}>
        {filtersOpen ? (
          <button
            type="button"
            className={styles.filterBackdrop}
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
        ) : null}
        <aside
          className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`}
          aria-label="Product filters"
          aria-modal={filtersOpen || undefined}
          role={filtersOpen ? 'dialog' : undefined}
        >
          <div className={styles.filterHead}>
            <h2>Filter</h2>
            <div className={styles.filterHeadActions}>
              <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                Clear
              </button>
              <button
                type="button"
                className={styles.filterClose}
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                ×
              </button>
            </div>
          </div>

          <div className={styles.filterBody}>
          <section className={styles.filterSection}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection('category')}
              aria-expanded={openSections.category}
            >
              Category
              <span>{openSections.category ? '−' : '+'}</span>
            </button>
            {openSections.category ? (
              <ul className={`${styles.checkList} ${styles.categoryList}`}>
                <li>
                  <Link
                    to={`/categories/${slug}`}
                    className={!searchParams.get('sub') ? styles.checkOn : undefined}
                    onClick={() => setFiltersOpen(false)}
                  >
                    All in {title}
                  </Link>
                </li>
                {filterCategories.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/categories/${item.slug}`}
                      className={item.slug === slug ? styles.checkOn : undefined}
                      onClick={() => setFiltersOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className={styles.filterSection}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection('price')}
              aria-expanded={openSections.price}
            >
              Price (RWF)
              <span>{openSections.price ? '−' : '+'}</span>
            </button>
            {openSections.price ? (
              <form className={styles.priceForm} onSubmit={onPriceSubmit}>
                <Input name="minPrice" label="Min" defaultValue={minPrice} inputMode="numeric" />
                <Input name="maxPrice" label="Max" defaultValue={maxPrice} inputMode="numeric" />
                <Button type="submit" size="sm" variant="secondary">
                  Apply
                </Button>
              </form>
            ) : null}
          </section>

          <section className={styles.filterSection}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection('condition')}
              aria-expanded={openSections.condition}
            >
              Condition
              <span>{openSections.condition ? '−' : '+'}</span>
            </button>
            {openSections.condition ? (
              <ul className={styles.checkList}>
                {CONDITIONS.map((item) => (
                  <li key={item.value}>
                    <label className={styles.checkRow}>
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

          <section className={styles.filterSection}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection('stock')}
              aria-expanded={openSections.stock}
            >
              Availability
              <span>{openSections.stock ? '−' : '+'}</span>
            </button>
            {openSections.stock ? (
              <label className={styles.checkRow}>
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

          <div className={styles.filterSheetFooter}>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Show {total} result{total === 1 ? '' : 's'}
            </Button>
          </div>
        </aside>

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <div>
              <h1>{title}</h1>
              <p className={styles.meta}>
                {isLoading ? 'Loading products…' : `${total} product${total === 1 ? '' : 's'}`}
                {isFetching && !isLoading ? ' · Updating…' : ''}
              </p>
            </div>
            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={`${styles.filterTrigger} ${activeFilterCount ? styles.filterTriggerActive : ''}`}
                onClick={() => setFiltersOpen(true)}
              >
                Filter
                {activeFilterCount ? <span className={styles.filterCount}>{activeFilterCount}</span> : null}
              </button>
              <label className={styles.sort}>
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

          {categoryError ? <Alert tone="error">{getErrorMessage(categoryErr)}</Alert> : null}
          {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
          {isLoading || categoryLoading ? <ProductGridSkeleton /> : null}
          {!isLoading && data?.items.length === 0 ? (
            <EmptyState
              title="No products in this category"
              description="Try clearing filters or browse another category."
              actionLabel="Clear filters"
              onAction={clearFilters}
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
  );
}
