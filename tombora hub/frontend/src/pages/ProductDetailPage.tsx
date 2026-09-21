import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddToCart,
  useAddToWishlist,
  useCreateReview,
  useMe,
  useProduct,
  useProductReviews,
  useProducts,
  useSendMessage,
} from '@/api/hooks';
import { Alert, Badge, Button, ProductGridSkeleton } from '@/components/ui';
import { PriceDisplay, ProductGrid, QuantitySelector, VariantSelector } from '@/components/product';
import gridStyles from '@/components/product/ProductGrid.module.css';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from './ProductDetailPage.module.css';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { data: product, isLoading, isError, error } = useProduct(slug);
  const { data: user } = useMe();
  const { data: reviews } = useProductReviews(product?.id);
  const categorySlug = product?.category.slug;
  const { data: relatedData, isLoading: relatedLoading } = useProducts({
    page: 1,
    limit: 12,
    ...(categorySlug ? { category: categorySlug } : {}),
    sort: 'popular',
  });
  const { data: popularData } = useProducts({
    page: 1,
    limit: 12,
    sort: 'popular',
  });
  const addToCart = useAddToCart();
  const addWishlist = useAddToWishlist();
  const createReview = useCreateReview();
  const sendMessage = useSendMessage();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const signInTo = loginHref(`${pathname}${search}`);

  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [sellerMsg, setSellerMsg] = useState('');
  const [mobileTab, setMobileTab] = useState<'overview' | 'details' | 'recommended'>('overview');
  const [attrsExpanded, setAttrsExpanded] = useState(false);

  useEffect(() => {
    setActiveImage(0);
    setPreviewOpen(false);
    if (product?.variants?.length) {
      const firstAvailable =
        product.variants.find((v) => (v.inventory?.available ?? 0) > 0) || product.variants[0];
      setVariantId(firstAvailable.id);
    }
  }, [product]);

  useEffect(() => {
    setQty(1);
  }, [variantId]);

  useEffect(() => {
    if (!previewOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPreviewOpen(false);
      if (e.key === 'ArrowRight') {
        setActiveImage((i) => (product?.images.length ? (i + 1) % product.images.length : i));
      }
      if (e.key === 'ArrowLeft') {
        setActiveImage((i) =>
          product?.images.length ? (i - 1 + product.images.length) % product.images.length : i,
        );
      }
    }
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [previewOpen, product?.images.length]);

  const reviewItems = reviews?.items || [];
  const relatedProducts = useMemo(() => {
    const currentId = product?.id;
    const fromCategory = (relatedData?.items || []).filter((item) => item.id !== currentId);
    if (fromCategory.length >= 4) return fromCategory.slice(0, 8);

    const seen = new Set(fromCategory.map((item) => item.id));
    if (currentId) seen.add(currentId);
    const fillers = (popularData?.items || []).filter((item) => !seen.has(item.id));
    return [...fromCategory, ...fillers].slice(0, 8);
  }, [relatedData?.items, popularData?.items, product?.id]);
  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const item of reviewItems) {
      const key = Math.min(5, Math.max(1, Math.round(item.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[key] += 1;
    }
    return counts;
  }, [reviewItems]);
  const reviewCount = reviewItems.length || product?.ratingCount || 0;
  const averageRating = Number(product?.ratingAvg || 0);

  const attrRows = useMemo(() => {
    if (!product) return [] as { name: string; value: string }[];
    const rows = [...(product.specifications || [])];
    if (product.condition) {
      rows.push({
        name: 'Condition',
        value: product.condition.replace(/_/g, ' ').toLowerCase(),
      });
    }
    if (product.weightGrams) {
      rows.push({ name: 'Weight', value: `${product.weightGrams} g` });
    }
    if (product.lengthMm || product.widthMm || product.heightMm) {
      rows.push({
        name: 'Dimensions',
        value: [product.lengthMm, product.widthMm, product.heightMm]
          .filter(Boolean)
          .map((mm) => `${Math.round(Number(mm) / 10)} cm`)
          .join(' × '),
      });
    }
    return rows;
  }, [product]);

  const visibleAttrs = attrsExpanded ? attrRows : attrRows.slice(0, 5);

  function initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
  }

  function starsRow(value: number) {
    const filled = Math.round(value);
    return '★★★★★'.slice(0, filled) + '☆☆☆☆☆'.slice(filled);
  }

  const selected = product?.variants.find((v) => v.id === variantId);
  const maxQty = selected?.inventory?.available ?? 1;
  const images = product?.images ?? [];
  const mainImage =
    images[activeImage]?.url ||
    images[0]?.url ||
    'https://placehold.co/800x800/d5e0d8/14201a?text=Product';
  const mainAlt = images[activeImage]?.altText || product?.name || 'Product';

  async function handleAdd() {
    setMessage(null);
    setErrMsg(null);
    if (!user) {
      navigate(signInTo);
      return;
    }
    if (!variantId) return;
    try {
      await addToCart.mutateAsync({ variantId, quantity: qty });
      setMessage('Added to cart');
    } catch (err) {
      setErrMsg(getErrorMessage(err, 'Could not add to cart'));
    }
  }

  async function handleWishlist() {
    if (!user) {
      navigate(signInTo);
      return;
    }
    if (!variantId) return;
    try {
      await addWishlist.mutateAsync(variantId);
      setMessage('Saved to wishlist');
    } catch (err) {
      setErrMsg(getErrorMessage(err));
    }
  }

  async function handleReview(e: FormEvent) {
    e.preventDefault();
    if (!user || !product) {
      navigate(signInTo);
      return;
    }
    try {
      await createReview.mutateAsync({
        productId: product.id,
        sellerId: product.store.seller.id,
        rating,
        body: reviewBody,
      });
      setReviewBody('');
      setMessage('Review submitted');
    } catch (err) {
      setErrMsg(getErrorMessage(err));
    }
  }

  async function handleContact(e: FormEvent) {
    e.preventDefault();
    if (!user || !product) {
      navigate(signInTo);
      return;
    }
    try {
      const result = await sendMessage.mutateAsync({
        sellerId: product.store.seller.id,
        productId: product.id,
        body: sellerMsg,
      });
      navigate(`/messages/${result.threadId}`);
    } catch (err) {
      setErrMsg(getErrorMessage(err));
    }
  }

  function goMobileTab(tab: 'overview' | 'details' | 'recommended') {
    setMobileTab(tab);
    const id =
      tab === 'overview' ? 'pd-overview' : tab === 'details' ? 'pd-details' : 'pd-recommended';
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function handleChatNow() {
    if (!user || !product) {
      navigate(signInTo);
      return;
    }
    try {
      const result = await sendMessage.mutateAsync({
        sellerId: product.store.seller.id,
        productId: product.id,
        body: `Hi, I'm interested in “${product.name}”.`,
      });
      navigate(`/messages/${result.threadId}`);
    } catch (err) {
      setErrMsg(getErrorMessage(err));
    }
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{product ? `${product.name} | NeereMarket` : 'Product | NeereMarket'}</title>
      </Helmet>

      {isLoading ? <ProductGridSkeleton count={2} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {errMsg ? <Alert tone="error">{errMsg}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}

      {product ? (
        <>
          <div className={styles.mobileTabs} role="tablist" aria-label="Product sections">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'overview'}
              className={mobileTab === 'overview' ? styles.mobileTabActive : styles.mobileTab}
              onClick={() => goMobileTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'details'}
              className={mobileTab === 'details' ? styles.mobileTabActive : styles.mobileTab}
              onClick={() => goMobileTab('details')}
            >
              Details
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'recommended'}
              className={mobileTab === 'recommended' ? styles.mobileTabActive : styles.mobileTab}
              onClick={() => goMobileTab('recommended')}
            >
              Recommended
            </button>
          </div>

          <div className={styles.layout}>
            <div className={styles.leftCol}>
              <div className={styles.gallery} id="pd-overview">
                <button
                  type="button"
                  className={styles.mainImageBtn}
                  onClick={() => setPreviewOpen(true)}
                  aria-label="Open image preview"
                >
                  <img src={mainImage} alt={mainAlt} />
                  {images.length > 0 ? (
                    <span className={styles.mediaPill} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.1l1.2-1.5h4.4L15.4 5h2.1A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                      <span>
                        {activeImage + 1}/{images.length || 1}
                      </span>
                    </span>
                  ) : null}
                  <span className={styles.zoomHint} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M16 16l5 5M10.5 8v5M8 10.5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                {images.length > 1 ? (
                  <div className={styles.thumbs} role="list">
                    {images.map((image, index) => (
                      <button
                        key={image.url + index}
                        type="button"
                        className={index === activeImage ? styles.thumbActive : styles.thumb}
                        onClick={() => setActiveImage(index)}
                        onDoubleClick={() => {
                          setActiveImage(index);
                          setPreviewOpen(true);
                        }}
                        aria-label={`View photo ${index + 1}`}
                      >
                        <img src={image.url} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <section className={styles.reviewsPanel} aria-labelledby="reviews-heading">
                <div className={styles.reviewsHead}>
                  <h2 id="reviews-heading">
                    Customer Reviews
                    {reviewCount > 0 ? ` (${reviewCount}+)` : ''}
                  </h2>
                  {reviewItems.length > 3 ? (
                    <a href="#reviews-list" className={styles.viewMoreReviews}>
                      View More ›
                    </a>
                  ) : null}
                </div>

                <div className={styles.reviewsSummary}>
                  <div className={styles.scoreBlock}>
                    <p className={styles.scoreValue}>{averageRating.toFixed(2)}</p>
                    <div>
                      <p className={styles.scoreStars} aria-hidden="true">
                        {starsRow(averageRating)}
                      </p>
                      <p className={styles.scoreMeta}>
                        {reviewCount} review{reviewCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <ul className={styles.breakdown}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingBreakdown[star as 1 | 2 | 3 | 4 | 5];
                      const pct = reviewItems.length
                        ? Math.round((count / reviewItems.length) * 100)
                        : 0;
                      return (
                        <li key={star}>
                          <span>{star}★</span>
                          <span className={styles.barTrack}>
                            <span className={styles.barFill} style={{ width: `${pct}%` }} />
                          </span>
                          <span>{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {reviewItems.length ? (
                  <ul id="reviews-list" className={styles.reviews}>
                    {reviewItems.map((r) => (
                      <li key={r.id} className={styles.reviewCard}>
                        <div className={styles.reviewTop}>
                          <span className={styles.avatar} aria-hidden="true">
                            {initials(r.customer.fullName)}
                          </span>
                          <div className={styles.reviewMeta}>
                            <div className={styles.reviewNameRow}>
                              <strong>{r.customer.fullName}</strong>
                              {r.isVerifiedPurchase ? (
                                <Badge tone="success">Verified purchase</Badge>
                              ) : null}
                            </div>
                            <div className={styles.reviewSub}>
                              <span className={styles.reviewStars} aria-label={`${r.rating} stars`}>
                                {starsRow(r.rating)}
                              </span>
                              <time dateTime={r.createdAt}>
                                {new Date(r.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </time>
                            </div>
                          </div>
                        </div>
                        <p className={styles.reviewBody}>
                          {r.body?.trim() || 'No written review left with this rating.'}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.reviewsEmpty}>
                    <h3>No reviews yet</h3>
                    <p>Be the first to share your experience with this product.</p>
                  </div>
                )}

                <form className={styles.reviewComposer} onSubmit={handleReview}>
                  <div className={styles.composerHead}>
                    <h3>Write a review</h3>
                    <p>Help other shoppers with an honest rating and short note.</p>
                  </div>
                  <div className={styles.starPicker} role="group" aria-label="Your rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={n <= rating ? styles.starOn : styles.starOff}
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n === 1 ? '' : 's'}`}
                        aria-pressed={n === rating}
                      >
                        ★
                      </button>
                    ))}
                    <span className={styles.starLabel}>{rating} / 5</span>
                  </div>
                  <label className={styles.composerField}>
                    Your review
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      rows={3}
                      placeholder="What did you like? How was quality, fit, or delivery?"
                    />
                  </label>
                  <div className={styles.composerActions}>
                    <Button type="submit" disabled={createReview.isPending}>
                      {createReview.isPending ? 'Submitting…' : 'Submit review'}
                    </Button>
                    {!user ? (
                      <p className={styles.composerHint}>You’ll be asked to log in if needed.</p>
                    ) : null}
                  </div>
                </form>
              </section>
            </div>

            <div className={styles.info}>
              <p className={styles.crumb}>
                <Link to="/products">Products</Link>
                {product.category.parent ? (
                  <>
                    <span>/</span>
                    <Link to={`/categories/${product.category.parent.slug}`}>
                      {product.category.parent.name}
                    </Link>
                  </>
                ) : null}
                <span>/</span>
                <Link to={`/categories/${product.category.slug}`}>{product.category.name}</Link>
              </p>

              <h1 className={styles.title}>{product.name}</h1>

              <div className={styles.metaRow}>
                {selected?.sku || product.slug ? (
                  <p className={styles.sku}>
                    SKU: <span>{selected?.sku || product.slug}</span>
                  </p>
                ) : null}
                <a href="#reviews-heading" className={styles.reviewsLink}>
                  <span aria-hidden="true">{starsRow(averageRating)}</span>
                  <span>
                    ({reviewCount > 0 ? `${reviewCount}+ Reviews` : 'No reviews yet'})
                  </span>
                </a>
              </div>

              <div className={styles.priceBlock}>
                <PriceDisplay
                  price={product.price}
                  discountPrice={selected?.price || product.discountPrice}
                  size="lg"
                />
              </div>
              <p className={styles.moqLine}>
                {selected?.inventory
                  ? (selected.inventory.available ?? 0) > 0
                    ? `${selected.inventory.available} available`
                    : 'Out of stock'
                  : 'Availability varies'}
              </p>

              <Link to={`/categories/${product.category.slug}`} className={styles.promoBanner}>
                <span className={styles.promoBadge}>Top pick</span>
                <span className={styles.promoText}>
                  in {product.category.parent ? `${product.category.parent.name} / ` : ''}
                  {product.category.name}
                </span>
                <span className={styles.promoArrow} aria-hidden="true">
                  ›
                </span>
              </Link>

              <div className={styles.optionsBlock}>
                <VariantSelector
                  variants={product.variants}
                  selectedId={variantId}
                  onSelect={setVariantId}
                />
              </div>

              <div className={styles.qtyRow}>
                {(selected?.inventory?.available ?? 0) > 0 ? (
                  <QuantitySelector value={qty} max={Math.max(1, maxQty)} onChange={setQty} />
                ) : null}
                <p className={styles.stock}>
                  {selected?.inventory
                    ? (selected.inventory.available ?? 0) > 0
                      ? `${selected.inventory.available} available`
                      : 'This option is out of stock'
                    : 'Availability varies'}
                </p>
              </div>

              <div className={styles.actions}>
                <Button
                  type="button"
                  className={styles.addToCart}
                  disabled={
                    !selected || (selected.inventory?.available ?? 0) < 1 || addToCart.isPending
                  }
                  onClick={() => void handleAdd()}
                >
                  {addToCart.isPending ? 'Adding…' : 'Add to cart'}
                </Button>
                <button
                  type="button"
                  className={styles.wishlistBtn}
                  onClick={() => void handleWishlist()}
                  aria-label="Add to wishlist"
                  title="Add to wishlist"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 20s-7-4.35-7-9.2A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7 3.7C19 15.65 12 20 12 20z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {attrRows.length ? (
                <section className={styles.attrPanel} aria-labelledby="attrs-heading">
                  <h2 id="attrs-heading">Product Attributes</h2>
                  <dl className={styles.attrList}>
                    {visibleAttrs.map((row) => (
                      <div key={`${row.name}-${row.value}`}>
                        <dt>{row.name}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {attrRows.length > 5 ? (
                    <button
                      type="button"
                      className={styles.viewMoreAttrs}
                      onClick={() => setAttrsExpanded((v) => !v)}
                    >
                      {attrsExpanded ? 'View less' : 'View more'}
                      <span aria-hidden="true">{attrsExpanded ? ' ˄' : ' ˅'}</span>
                    </button>
                  ) : null}
                </section>
              ) : null}

              <div className={styles.detailPanel} id="pd-details">
                <h2>Product details</h2>
                {product.shortDescription ? (
                  <p className={styles.shortDesc}>{product.shortDescription}</p>
                ) : null}
                <div className={styles.longDesc}>
                  {product.description || 'No description yet.'}
                </div>
                {attrRows.length ? (
                  <dl className={`${styles.specs} ${styles.desktopSpecsOnly}`}>
                    {attrRows.map((row) => (
                      <div key={`desk-${row.name}-${row.value}`}>
                        <dt>{row.name}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>

              <div className={styles.sellerBox}>
                {product.store.seller.verificationStatus === 'VERIFIED' ? (
                  <Badge>Verified seller</Badge>
                ) : null}
                <Link to={`/stores/${product.store.slug}`}>
                  <strong>{product.store.name}</strong>
                </Link>
                <span>
                  {[product.store.seller.district, product.store.seller.province]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>

              <form className={styles.contactBox} onSubmit={handleContact}>
                <h3>Contact seller</h3>
                <label className={styles.composerField}>
                  Message
                  <textarea
                    value={sellerMsg}
                    onChange={(e) => setSellerMsg(e.target.value)}
                    rows={3}
                    required
                    placeholder="Ask about size, delivery, or stock…"
                  />
                </label>
                <Button type="submit" disabled={sendMessage.isPending}>
                  Send message
                </Button>
              </form>
            </div>
          </div>

          <section
            className={styles.alsoViewed}
            id="pd-recommended"
            aria-labelledby="also-viewed-heading"
          >
            <div className={styles.alsoViewedHead}>
              <div>
                <p className={styles.reviewsKicker}>Discover more</p>
                <h2 id="also-viewed-heading">Customers also viewed</h2>
              </div>
              <Link
                to={
                  product.category?.slug
                    ? `/categories/${product.category.slug}`
                    : '/products'
                }
                className={styles.alsoViewedLink}
              >
                {product.category?.name
                  ? `See more in ${product.category.name}`
                  : 'Browse products'}
              </Link>
            </div>
            {relatedLoading && !relatedProducts.length ? <ProductGridSkeleton count={4} /> : null}
            {relatedProducts.length ? (
              <ProductGrid products={relatedProducts} className={gridStyles.dense} />
            ) : !relatedLoading ? (
              <p className={styles.alsoViewedEmpty}>More recommendations will appear here soon.</p>
            ) : null}
          </section>

          <div className={styles.mobileCta} aria-label="Product actions">
            <button
              type="button"
              className={styles.mobileChat}
              onClick={() => void handleChatNow()}
              disabled={sendMessage.isPending}
            >
              <span className={styles.mobileChatIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9l-4 3v-3.2A2.5 2.5 0 0 1 4 14.5v-8z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Chat now</span>
            </button>
            <button
              type="button"
              className={styles.mobileBuy}
              disabled={
                !selected || (selected.inventory?.available ?? 0) < 1 || addToCart.isPending
              }
              onClick={() => void handleAdd()}
            >
              {addToCart.isPending ? 'Adding…' : 'Add to cart'}
            </button>
          </div>
        </>
      ) : null}

      {product && previewOpen ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewOpen(false)}
        >
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
            >
              ×
            </button>
            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={() =>
                  setActiveImage((i) => (i - 1 + images.length) % images.length)
                }
                aria-label="Previous image"
              >
                ‹
              </button>
            ) : null}
            <img src={mainImage} alt={mainAlt} className={styles.lightboxImage} />
            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                aria-label="Next image"
              >
                ›
              </button>
            ) : null}
            {images.length > 1 ? (
              <div className={styles.lightboxThumbs}>
                {images.map((image, index) => (
                  <button
                    key={image.url + index}
                    type="button"
                    className={
                      index === activeImage ? styles.lightboxThumbActive : styles.lightboxThumb
                    }
                    onClick={() => setActiveImage(index)}
                    aria-label={`Preview photo ${index + 1}`}
                  >
                    <img src={image.url} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
            {images.length > 1 ? (
              <p className={styles.lightboxCount}>
                {activeImage + 1} / {images.length}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
