import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useAddToCart,
  useAddToWishlist,
  useCategories,
  useCategory,
  useProducts,
  useRemoveFromWishlist,
  useWishlist,
  type ProductListItem,
} from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton, useToast } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import { getErrorMessage } from '@/api/client';
import { FALLBACK_CATEGORY_VISUAL } from '@/utils/categoryVisuals';
import styles from './CategoryPage.module.css';

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'USED', label: 'Used' },
  { value: 'REFURBISHED', label: 'Refurbished' },
] as const;

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'audited'>('products');

  // Filter States
  const sort = searchParams.get('sort') || 'popular';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const condition = searchParams.get('condition') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const auditedOnly = searchParams.get('audited') === 'true';
  const page = Number(searchParams.get('page') || '1') || 1;

  // Business Type & R&D Filter dummy states (for authentic B2B look)
  const [tradingCo, setTradingCo] = useState(false);
  const [factory, setFactory] = useState(false);
  const [groupCorp, setGroupCorp] = useState(false);
  const [odm, setOdm] = useState(false);
  const [oem, setOem] = useState(false);
  const [ownBrand, setOwnBrand] = useState(false);

  // Mobile Filter Drawer Popup State
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Lock background scrolling when filter popup is open on mobile
  useEffect(() => {
    if (filtersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  // Close filter drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && filtersOpen) {
        setFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtersOpen]);

  // Compute number of active filters for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (minPrice || maxPrice) count += 1;
    if (condition) count += 1;
    if (inStock) count += 1;
    if (auditedOnly) count += 1;
    if (tradingCo) count += 1;
    if (factory) count += 1;
    if (groupCorp) count += 1;
    if (odm) count += 1;
    if (oem) count += 1;
    if (ownBrand) count += 1;
    return count;
  }, [
    minPrice,
    maxPrice,
    condition,
    inStock,
    auditedOnly,
    tradingCo,
    factory,
    groupCorp,
    odm,
    oem,
    ownBrand,
  ]);

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

  const { data, isLoading, isError, error } = useProducts(productParams);

  // Wishlist & Cart Hooks
  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  const wishlistIds = useMemo(() => {
    const set = new Set<string>();
    if (wishlistData?.items) {
      for (const item of wishlistData.items) {
        set.add(item.product.id);
      }
    }
    return set;
  }, [wishlistData]);

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
    setTradingCo(false);
    setFactory(false);
    setGroupCorp(false);
    setOdm(false);
    setOem(false);
    setOwnBrand(false);
  }

  const title = category?.name || 'Electronics';
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const handleToggleWishlist = async (product: ProductListItem) => {
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      navigate(`/products/${product.slug}`);
      return;
    }
    const isWishlisted = wishlistIds.has(product.id);
    try {
      if (isWishlisted) {
        await removeFromWishlist.mutateAsync(variantId);
        toast.info('Removed from wishlist');
      } else {
        await addToWishlist.mutateAsync(variantId);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.info(isWishlisted ? 'Failed to remove' : 'Please sign in to save items');
    }
  };

  const handleAddToCart = async (product: ProductListItem) => {
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      navigate(`/products/${product.slug}`);
      return;
    }
    try {
      await addToCart.mutateAsync({ variantId, quantity: 1 });
      toast.success('Added to cart');
    } catch {
      navigate(`/products/${product.slug}`);
    }
  };

  const handleBuyNow = async (product: ProductListItem) => {
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      navigate(`/products/${product.slug}`);
      return;
    }
    try {
      await addToCart.mutateAsync({ variantId, quantity: 1 });
      navigate('/cart');
    } catch {
      navigate(`/products/${product.slug}`);
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`${title} | NeereMarket`}</title>
        <meta
          name="description"
          content={`Browse ${title} products from verified Rwandan suppliers, boutiques, and merchants.`}
        />
      </Helmet>

      {/* Breadcrumbs */}
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

      {/* Top Tabs matching reference design */}
      <div className={styles.topTabBar}>
        <div className={styles.topTabs}>
          <button
            type="button"
            className={`${styles.topTab} ${activeTab === 'products' ? styles.topTabActive : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Product List
          </button>
          <Link to="/stores" className={styles.topTab}>
            Supplier List
          </Link>
          <button
            type="button"
            className={`${styles.topTab} ${auditedOnly ? styles.topTabActive : ''}`}
            onClick={() => setParam('audited', auditedOnly ? null : 'true')}
          >
            Audited Factory
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {filtersOpen && (
        <div
          className={styles.filterBackdrop}
          onClick={() => setFiltersOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.layout}>
        {/* Left Filter Sidebar / Mobile Popup Drawer */}
        <aside
          className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`}
          aria-label="Product filters"
        >
          <div className={styles.filterHead}>
            <h2>Filter</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                Clear
              </button>
              <button
                type="button"
                className={styles.filterClose}
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
          </div>

          <div className={styles.filterBody}>

          {/* Top Verification Filter Badges */}
          <div className={styles.filterSection}>
            <ul className={styles.checkList}>
              <li>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={auditedOnly}
                    onChange={() => setParam('audited', auditedOnly ? null : 'true')}
                  />
                  <span className={styles.badgeAudited}>
                    <span>A</span>udited
                  </span>
                </label>
              </li>
              <li>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={() => setParam('inStock', inStock ? null : 'true')}
                  />
                  <span className={styles.badgeSecured}>Secured Trading</span>
                  <span className={styles.infoIcon} title="Protected transactions in RWF">
                    ⓘ
                  </span>
                </label>
              </li>
              <li>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={tradingCo}
                    onChange={(e) => setTradingCo(e.target.checked)}
                  />
                  <span className={styles.badgeLeading}>Verified Stores</span>
                </label>
              </li>
            </ul>
          </div>

          {/* Business Type */}
          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>Business Type</p>
            <ul className={styles.checkList}>
              <li>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={tradingCo}
                    onChange={(e) => setTradingCo(e.target.checked)}
                  />
                  Trading Company
                </label>
              </li>
              <li>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={factory}
                    onChange={(e) => setFactory(e.target.checked)}
                  />
                  Manufacturer/Factory
                </label>
              </li>
              <li>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={groupCorp}
                    onChange={(e) => setGroupCorp(e.target.checked)}
                  />
                  Group Corporation
                </label>
              </li>
            </ul>
          </div>

          {/* R&D Capacity */}
          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>R&D Capacity</p>
            <ul className={styles.checkList}>
              <li>
                <label className={styles.checkRow}>
                  <input type="checkbox" checked={odm} onChange={(e) => setOdm(e.target.checked)} />
                  ODM
                </label>
              </li>
              <li>
                <label className={styles.checkRow}>
                  <input type="checkbox" checked={oem} onChange={(e) => setOem(e.target.checked)} />
                  OEM
                </label>
              </li>
              <li>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={ownBrand}
                    onChange={(e) => setOwnBrand(e.target.checked)}
                  />
                  Own Brand
                </label>
              </li>
            </ul>
          </div>

          {/* Condition */}
          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>Condition</p>
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
          </div>

          {/* Price Range */}
          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>Price (RWF)</p>
            <form className={styles.priceForm} onSubmit={onPriceSubmit}>
              <input
                className={styles.priceInput}
                name="minPrice"
                placeholder="Min"
                defaultValue={minPrice}
                inputMode="numeric"
              />
              <span style={{ color: '#94a3b8' }}>-</span>
              <input
                className={styles.priceInput}
                name="maxPrice"
                placeholder="Max"
                defaultValue={maxPrice}
                inputMode="numeric"
              />
              <button type="submit" className={styles.priceApplyBtn}>
                Apply
              </button>
            </form>
          </div>
          </div>

          {/* Filter Footer for Mobile Drawer */}
          <div className={styles.filterFooter}>
            <button
              type="button"
              className={styles.applyFilterBtn}
              onClick={() => setFiltersOpen(false)}
            >
              Show {total > 0 ? `${total.toLocaleString()} ` : ''}Results
            </button>
          </div>
        </aside>

        {/* Right Main Column */}
        <div className={styles.main}>
          {/* Query Title & View Switcher */}
          <div className={styles.resultsHeader}>
            <h1 className={styles.resultsQueryTitle}>
              "{title}"
              <span className={styles.resultsCount}>
                {isLoading ? 'Searching products…' : `${total.toLocaleString()}+ results`}
              </span>
            </h1>

            <div className={styles.headerRightActions}>
              <button
                type="button"
                className={`${styles.mobileFilterBtn} ${activeFilterCount > 0 ? styles.mobileFilterBtnActive : ''}`}
                onClick={() => setFiltersOpen(true)}
                aria-label="Open filters"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className={styles.filterBadge}>{activeFilterCount}</span>
                )}
              </button>

              <div className={styles.viewSwitcher} aria-label="View layout">
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="List View"
                >
                  {/* List View Icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <rect x="3" y="4" width="3" height="4" rx="1" fill="currentColor" />
                    <rect x="3" y="10" width="3" height="4" rx="1" fill="currentColor" />
                    <rect x="3" y="16" width="3" height="4" rx="1" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  {/* Grid View Icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Subcategory Pills Bar */}
          <div className={styles.pillsBar}>
            <Link
              to={`/categories/${slug}`}
              className={`${styles.pillTag} ${styles.pillTagActive}`}
            >
              All {title}
            </Link>
            {filterCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className={styles.pillTag}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {categoryError ? <Alert tone="error">{getErrorMessage(categoryErr)}</Alert> : null}
          {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
          {isLoading || categoryLoading ? <ProductGridSkeleton count={4} /> : null}

          {!isLoading && data?.items.length === 0 ? (
            <EmptyState
              title="No products in this category"
              description="Try clearing filters or explore another subcategory."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : null}

          {/* Products Render: List View vs Grid View */}
          {!isLoading && data?.items.length ? (
            viewMode === 'list' ? (
              <div className={styles.listStack}>
                {data.items.map((product) => {
                  const isWishlisted = wishlistIds.has(product.id);
                  const priceNum = Number(product.price);
                  const discountNum = product.discountPrice ? Number(product.discountPrice) : null;
                  const displayPrice = discountNum ? discountNum.toLocaleString() : priceNum.toLocaleString();
                  const primaryImg = product.images[0]?.url || FALLBACK_CATEGORY_VISUAL.image;

                  return (
                    <article key={product.id} className={styles.listCard}>
                      {/* Left: Product Image Box */}
                      <div className={styles.imageBox}>
                        <Link to={`/products/${product.slug}`} style={{ display: 'contents' }}>
                          <img src={primaryImg} alt={product.name} loading="lazy" />
                        </Link>
                        <button
                          type="button"
                          className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistBtnActive : ''}`}
                          aria-label="Wishlist"
                          onClick={() => handleToggleWishlist(product)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>

                      {/* Right: Product Details & B2B Specs */}
                      <div className={styles.cardDetails}>
                        <span className={styles.securedBadge}>Secured Trading</span>

                        <Link to={`/products/${product.slug}`} className={styles.productTitle}>
                          {product.name}
                        </Link>

                        <div className={styles.priceRow}>
                          <span className={styles.priceValue}>
                            RWF {displayPrice}
                          </span>
                          <span className={styles.priceTag}>(FOB Price)</span>
                        </div>

                        <p className={styles.moqText}>1 Piece (MOQ) · Direct Kigali Supply</p>

                        {/* 2-Column Specifications Grid */}
                        <div className={styles.specsGrid}>
                          <div className={styles.specItem}>
                            <span className={styles.specLabel}>Category:</span>
                            <span className={styles.specVal}>{product.category.name}</span>
                          </div>
                          <div className={styles.specItem}>
                            <span className={styles.specLabel}>Usage:</span>
                            <span className={styles.specVal}>Commercial & Personal</span>
                          </div>
                          <div className={styles.specItem}>
                            <span className={styles.specLabel}>Location:</span>
                            <span className={styles.specVal}>{product.store.seller.district || 'Kigali, Rwanda'}</span>
                          </div>
                          <div className={styles.specItem}>
                            <span className={styles.specLabel}>Feature:</span>
                            <span className={styles.specVal}>Fast Delivery, Verified</span>
                          </div>
                          <div className={styles.specItem}>
                            <span className={styles.specLabel}>Payment:</span>
                            <span className={styles.specVal}>MTN MoMo & Airtel</span>
                          </div>
                          <div className={styles.specItem}>
                            <span className={styles.specLabel}>Dispatch:</span>
                            <span className={styles.specVal}>Same Day Kigali Dispatch</span>
                          </div>
                        </div>

                        {/* Store Row */}
                        <div className={styles.sellerRow}>
                          <Link to={`/stores/${product.store.slug}`} className={styles.sellerLink}>
                            {product.store.name} ›
                          </Link>
                          <span className={styles.auditedSellerBadge}>
                            <span>A</span>udited
                          </span>
                          <span className={styles.ratingStars} aria-label="Rating 5 stars">
                            ★★★★★
                          </span>
                        </div>

                        {/* Bottom Actions Row */}
                        <div className={styles.actionsRow}>
                          <button
                            type="button"
                            className={styles.buyNowBtn}
                            onClick={() => handleBuyNow(product)}
                          >
                            Buy Now
                          </button>
                          <Link
                            to={`/messages?seller=${product.store.slug}`}
                            className={styles.inquiryBtn}
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          >
                            Send Inquiry
                          </Link>
                          <Link
                            to={`/messages?seller=${product.store.slug}`}
                            className={styles.chatLink}
                            style={{ textDecoration: 'none' }}
                          >
                            <span className={styles.chatIcon} />
                            Chat Now
                          </Link>
                          <button
                            type="button"
                            className={styles.cartQuickBtn}
                            title="Add to cart"
                            aria-label="Add to cart"
                            onClick={() => handleAddToCart(product)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="21" r="1" />
                              <circle cx="20" cy="21" r="1" />
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <ProductGrid products={data.items} />
            )
          ) : null}

          {/* Pagination */}
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
