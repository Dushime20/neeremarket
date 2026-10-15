import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddToCart,
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
  useCreateReview,
  useMe,
  useProduct,
  useProductReviews,
  useProducts,
  useSendMessage,
} from '@/api/hooks';
import { Alert, Badge, Button, ProductGridSkeleton, useToast } from '@/components/ui';
import { PriceDisplay, ProductGrid, QuantitySelector, VariantSelector } from '@/components/product';
import gridStyles from '@/components/product/ProductGrid.module.css';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './ProductDetailPage.module.css';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const toast = useToast();
  const { data: product, isLoading, isError, error } = useProduct(slug);
  const { data: user } = useMe();
  const { data: reviews } = useProductReviews(product?.id);
  const { data: wishlist } = useWishlist();
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
  const removeWishlist = useRemoveFromWishlist();
  const createReview = useCreateReview();
  const sendMessage = useSendMessage();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const signInTo = loginHref(`${pathname}${search}`);

  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [sellerMsg, setSellerMsg] = useState('');
  const [mobileTab, setMobileTab] = useState<'overview' | 'details' | 'reviews' | 'recommended'>('overview');
  const [attrsExpanded, setAttrsExpanded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setActiveImage(0);
    setPreviewOpen(false);
    setIsZoomed(false);
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
    setIsZoomed(false);
  }, [activeImage, previewOpen]);

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
      if (e.key === 'z' || e.key === 'Z') {
        setIsZoomed((z) => !z);
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

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  }

  function handleTouchMove(e: React.TouchEvent) {
    setTouchEndX(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStartX === null || touchEndX === null || !product?.images.length) return;
    const diff = touchStartX - touchEndX;
    if (diff > 40) {
      // Swiped left -> next
      setActiveImage((i) => (i + 1) % product.images.length);
    } else if (diff < -40) {
      // Swiped right -> prev
      setActiveImage((i) => (i - 1 + product.images.length) % product.images.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  }

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

  const selected = product?.variants.find((v) => v.id === variantId);
  const maxQty = selected?.inventory?.available ?? 1;
  const availableStock = selected?.inventory?.available ?? 0;
  const isOutOfStock = !selected || availableStock < 1;
  const isLowStock = !isOutOfStock && availableStock <= 3;

  const activePriceNum = Number(selected?.price || product?.discountPrice || product?.price || 0);
  const originalPriceNum = Number(product?.price || 0);
  const savingsAmount = originalPriceNum > activePriceNum ? originalPriceNum - activePriceNum : 0;

  const isWishlisted = useMemo(() => {
    if (!wishlist?.items || !product) return false;
    return wishlist.items.some(
      (item) => item.product?.id === product.id || (variantId && item.variantId === variantId),
    );
  }, [wishlist?.items, product, variantId]);

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
      toast.success('Added to your cart!', product?.name);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not add to cart');
      setErrMsg(msg);
      toast.error(msg);
    }
  }

  async function handleBuyNow() {
    if (!user) {
      navigate(signInTo);
      return;
    }
    if (!variantId) return;
    try {
      await addToCart.mutateAsync({ variantId, quantity: qty });
      navigate('/cart');
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not proceed to checkout');
      toast.error(msg);
    }
  }

  async function handleWishlistToggle() {
    if (!user) {
      navigate(signInTo);
      return;
    }
    if (!variantId) return;
    try {
      if (isWishlisted) {
        await removeWishlist.mutateAsync(variantId);
        toast.success('Removed from wishlist');
      } else {
        await addWishlist.mutateAsync(variantId);
        toast.success('Saved to your wishlist!', product?.name);
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrMsg(msg);
      toast.error(msg);
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
      toast.success('Thank you! Review submitted.');
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

  function goMobileTab(tab: 'overview' | 'details' | 'reviews' | 'recommended') {
    setMobileTab(tab);
    const id =
      tab === 'overview'
        ? 'pd-overview'
        : tab === 'details'
          ? 'pd-details'
          : tab === 'reviews'
            ? 'pd-reviews'
            : 'pd-recommended';
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
              aria-selected={mobileTab === 'reviews'}
              className={mobileTab === 'reviews' ? styles.mobileTabActive : styles.mobileTab}
              onClick={() => goMobileTab('reviews')}
            >
              Reviews {reviewCount > 0 ? `(${reviewCount})` : ''}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'recommended'}
              className={mobileTab === 'recommended' ? styles.mobileTabActive : styles.mobileTab}
              onClick={() => goMobileTab('recommended')}
            >
              Related
            </button>
          </div>

          <div className={styles.layout}>
            <div className={styles.leftCol}>
              <div className={styles.gallery} id="pd-overview">
                <div
                  className={styles.galleryMainWrap}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <button
                    type="button"
                    className={styles.mainImageBtn}
                    onClick={() => setPreviewOpen(true)}
                    aria-label="Open fullscreen image preview"
                  >
                    <img src={mainImage} alt={mainAlt} />

                    <div className={styles.galleryTopBadges}>
                      {savingsAmount > 0 ? (
                        <span className={styles.gallerySaleTag}>
                          SAVE {formatRwf(savingsAmount)}
                        </span>
                      ) : null}
                      {product.condition ? (
                        <span className={styles.galleryConditionTag}>
                          {product.condition.replace(/_/g, ' ')}
                        </span>
                      ) : null}
                    </div>

                    <span className={styles.galleryExpandBtn} aria-hidden="true" title="Fullscreen view">
                      <svg viewBox="0 0 24 24">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>

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
                  </button>

                  {images.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className={styles.galleryArrowPrev}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImage((i) => (i - 1 + images.length) % images.length);
                        }}
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className={styles.galleryArrowNext}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImage((i) => (i + 1) % images.length);
                        }}
                        aria-label="Next photo"
                      >
                        ›
                      </button>
                      <div className={styles.galleryDots} role="tablist" aria-label="Photo carousel pagination">
                        {images.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            type="button"
                            className={dotIdx === activeImage ? styles.galleryDotActive : styles.galleryDot}
                            onClick={() => setActiveImage(dotIdx)}
                            aria-label={`Go to photo ${dotIdx + 1}`}
                            aria-current={dotIdx === activeImage}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>

                {images.length > 1 ? (
                  <div className={styles.thumbs} role="list" aria-label="Product thumbnails">
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

              <section className={styles.reviewsPanel} id="pd-reviews" aria-labelledby="reviews-heading">
                <div className={styles.reviewsHead}>
                  <div>
                    <h2 id="reviews-heading">Customer Reviews</h2>
                    <p className={styles.reviewsSubhead}>
                      Ratings & feedback from verified Rwandan buyers
                    </p>
                  </div>
                  {reviewItems.length > 3 ? (
                    <a href="#reviews-list" className={styles.viewMoreReviews}>
                      All {reviewCount} reviews ›
                    </a>
                  ) : null}
                </div>

                <div className={styles.reviewsSummary}>
                  <div className={styles.scoreBlock}>
                    <p className={styles.scoreValue}>{averageRating > 0 ? averageRating.toFixed(1) : '5.0'}</p>
                    <div>
                      <p className={styles.scoreStars} aria-hidden="true">
                        {starsRow(averageRating || 5)}
                      </p>
                      <p className={styles.scoreMeta}>
                        Based on {reviewCount} review{reviewCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <ul className={styles.breakdown} aria-label="Rating breakdown">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingBreakdown[star as 1 | 2 | 3 | 4 | 5];
                      const pct = reviewItems.length
                        ? Math.round((count / reviewItems.length) * 100)
                        : star === 5
                          ? 100
                          : 0;
                      return (
                        <li key={star}>
                          <span className={styles.breakdownStar}>{star}★</span>
                          <span className={styles.barTrack}>
                            <span className={styles.barFill} style={{ width: `${pct}%` }} />
                          </span>
                          <span className={styles.breakdownCount}>{count}</span>
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
                                <Badge tone="success">✓ Verified buyer</Badge>
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
                    <p className={styles.emptyStars} aria-hidden="true">★★★★★</p>
                    <h3>No reviews yet</h3>
                    <p>Be the first customer to share feedback on this product.</p>
                  </div>
                )}

                <form className={styles.reviewComposer} onSubmit={handleReview}>
                  <div className={styles.composerHead}>
                    <h3>Leave a Review</h3>
                    <p>Help other shoppers make an informed purchase decision.</p>
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
                    <span className={styles.starLabel}>{rating} of 5 stars</span>
                  </div>
                  <label className={styles.composerField}>
                    <span>Your experience</span>
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      rows={3}
                      placeholder="What did you like about the product, delivery speed, or quality?"
                    />
                  </label>
                  <div className={styles.composerActions}>
                    <Button type="submit" variant="primary" disabled={createReview.isPending}>
                      {createReview.isPending ? 'Submitting…' : 'Submit Review'}
                    </Button>
                    {!user ? (
                      <p className={styles.composerHint}>You’ll be asked to sign in to submit.</p>
                    ) : null}
                  </div>
                </form>
              </section>
            </div>

            <div className={styles.info}>
              <div className={styles.storeHeaderChip}>
                <Link to={`/stores/${product.store.slug}`} className={styles.storeHeaderLink}>
                  <span className={styles.storeHeaderIcon} aria-hidden="true">🏬</span>
                  <span className={styles.storeHeaderName}>{product.store.name}</span>
                </Link>
                {product.store.seller.verificationStatus === 'VERIFIED' ? (
                  <span className={styles.verifiedChip}>✓ Verified</span>
                ) : null}
                <span className={styles.storeLocationChip}>
                  📍 {[product.store.seller.district, product.store.seller.province].filter(Boolean).join(', ') || 'Rwanda'}
                </span>
              </div>

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
                <a href="#pd-reviews" className={styles.reviewsLink}>
                  <span aria-hidden="true" className={styles.reviewsStarsGold}>
                    {starsRow(averageRating || 5)}
                  </span>
                  <span>
                    {averageRating > 0 ? averageRating.toFixed(1) : '5.0'} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </a>
                <span className={styles.hotTag}>⚡ In High Demand</span>
              </div>

              <div className={styles.priceRow}>
                <div className={styles.priceBlock}>
                  <PriceDisplay
                    price={product.price}
                    discountPrice={selected?.price || product.discountPrice}
                    size="lg"
                  />
                </div>
                {savingsAmount > 0 ? (
                  <span className={styles.savingsTag}>
                    Save {formatRwf(savingsAmount)}
                  </span>
                ) : null}
              </div>

              <div className={styles.stockStatus}>
                {isOutOfStock ? (
                  <span className={styles.stockBadgeOut}>
                    <span className={styles.stockDotOut} aria-hidden="true" />
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className={styles.stockBadgeLow}>
                    <span className={styles.stockDotLow} aria-hidden="true" />
                    Only {availableStock} left in stock - order soon
                  </span>
                ) : (
                  <span className={styles.stockBadgeIn}>
                    <span className={styles.stockDotIn} aria-hidden="true" />
                    In Stock ({availableStock} available)
                  </span>
                )}
                <span className={styles.deliveryPromise}>• Dispatches within 24h across Rwanda</span>
              </div>

              <Link to={`/categories/${product.category.slug}`} className={styles.promoBanner}>
                <span className={styles.promoBadge}>Category</span>
                <span className={styles.promoText}>
                  Explore more in {product.category.parent ? `${product.category.parent.name} / ` : ''}
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
                <span className={styles.qtyLabel}>Quantity:</span>
                {!isOutOfStock ? (
                  <QuantitySelector value={qty} max={Math.max(1, maxQty)} onChange={setQty} />
                ) : null}
                <span className={styles.qtyStockHint}>
                  {!isOutOfStock
                    ? `${availableStock} units available`
                    : 'Option currently unavailable'}
                </span>
              </div>

              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.addToCart}
                  disabled={isOutOfStock || addToCart.isPending}
                  onClick={() => void handleAdd()}
                >
                  <svg viewBox="0 0 24 24" className={styles.btnCartIcon} aria-hidden="true">
                    <path
                      d="M6 6h15l-1.5 9h-12L4.5 3H2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="20" r="1.2" fill="currentColor" />
                    <circle cx="18" cy="20" r="1.2" fill="currentColor" />
                  </svg>
                  {addToCart.isPending ? 'Adding to cart…' : 'Add to Cart'}
                </Button>

                <button
                  type="button"
                  className={styles.buyNowBtn}
                  disabled={isOutOfStock || addToCart.isPending}
                  onClick={() => void handleBuyNow()}
                >
                  Buy Now
                </button>

                <button
                  type="button"
                  className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistBtnActive : ''}`}
                  onClick={() => void handleWishlistToggle()}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 20s-7-4.35-7-9.2A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7 3.7C19 15.65 12 20 12 20z"
                      fill={isWishlisted ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* NeereMarket Assurance Guarantee Strip */}
              <div className={styles.trustStrip} aria-label="Buyer protection guarantees">
                <div className={styles.trustItem}>
                  <span className={styles.trustIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M12 2l7 3v6c0 5.25-3.5 10-7 11-3.5-1-7-5.75-7-11V5l7-3z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 11.5l2 2 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <strong>NeereMarket Escrow</strong>
                    <p>Funds released only after you confirm delivery</p>
                  </div>
                </div>

                <div className={styles.trustItem}>
                  <span className={styles.trustIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M1 3h14v13H1zM15 8h4l3 3v5h-7V8z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle cx="5.5" cy="18.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="18.5" cy="18.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </span>
                  <div>
                    <strong>Swift Rwanda Delivery</strong>
                    <p>24h delivery in Kigali, express provincial transit</p>
                  </div>
                </div>

                <div className={styles.trustItem}>
                  <span className={styles.trustIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <strong>7-Day Returns</strong>
                    <p>Protected refund if item is damaged or incorrect</p>
                  </div>
                </div>
              </div>

              {attrRows.length ? (
                <section className={styles.attrPanel} aria-labelledby="attrs-heading">
                  <h2 id="attrs-heading">Key Specifications</h2>
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
                      {attrsExpanded ? 'Show fewer specifications' : `View all ${attrRows.length} specifications`}
                      <span aria-hidden="true">{attrsExpanded ? ' ˄' : ' ˅'}</span>
                    </button>
                  ) : null}
                </section>
              ) : null}

              <div className={styles.detailPanel} id="pd-details">
                <h2>Product Details</h2>
                {product.shortDescription ? (
                  <p className={styles.shortDesc}>{product.shortDescription}</p>
                ) : null}
                <div
                  className={`${styles.longDesc} ${
                    descExpanded ? styles.longDescExpanded : styles.longDescCollapsed
                  }`}
                >
                  {product.description || 'No detailed description provided.'}
                </div>
                {product.description && product.description.length > 180 ? (
                  <button
                    type="button"
                    className={styles.toggleDescBtn}
                    onClick={() => setDescExpanded((v) => !v)}
                  >
                    {descExpanded ? 'Show less' : 'Read full description'}
                    <span aria-hidden="true">{descExpanded ? ' ˄' : ' ˅'}</span>
                  </button>
                ) : null}

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

              {/* Merchant Showcase Card */}
              <div className={styles.sellerCard}>
                <div className={styles.sellerCardTop}>
                  <div className={styles.sellerAvatar} aria-hidden="true">
                    <span>{initials(product.store.name)}</span>
                  </div>
                  <div className={styles.sellerMeta}>
                    <div className={styles.sellerNameRow}>
                      <Link to={`/stores/${product.store.slug}`} className={styles.sellerName}>
                        {product.store.name}
                      </Link>
                      {product.store.seller.verificationStatus === 'VERIFIED' ? (
                        <span className={styles.verifiedTag}>✓ Verified Seller</span>
                      ) : null}
                    </div>
                    <p className={styles.sellerLocation}>
                      📍 {[product.store.seller.district, product.store.seller.province]
                        .filter(Boolean)
                        .join(', ') || 'Rwanda'}
                    </p>
                  </div>
                </div>

                <div className={styles.sellerActions}>
                  <Link to={`/stores/${product.store.slug}`} className={styles.sellerVisitBtn}>
                    Visit Store
                  </Link>
                  <button
                    type="button"
                    className={styles.sellerChatBtn}
                    onClick={() => void handleChatNow()}
                    disabled={sendMessage.isPending}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9l-4 3v-3.2A2.5 2.5 0 0 1 4 14.5v-8z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Message Seller
                  </button>
                </div>
              </div>

              <form className={styles.contactBox} onSubmit={handleContact}>
                <h3>Ask Seller a Question</h3>
                <label className={styles.composerField}>
                  <span>Message</span>
                  <textarea
                    value={sellerMsg}
                    onChange={(e) => setSellerMsg(e.target.value)}
                    rows={3}
                    required
                    placeholder="Ask about size, condition, bulk pricing, or delivery schedule…"
                  />
                </label>
                <Button type="submit" variant="primary" disabled={sendMessage.isPending}>
                  Send Message
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
                <p className={styles.reviewsKicker}>Explore More</p>
                <h2 id="also-viewed-heading">Customers Also Viewed</h2>
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
                  ? `See more in ${product.category.name} ›`
                  : 'Browse all products ›'}
              </Link>
            </div>
            {relatedLoading && !relatedProducts.length ? <ProductGridSkeleton count={4} /> : null}
            {relatedProducts.length ? (
              <ProductGrid products={relatedProducts} className={gridStyles.dense} />
            ) : !relatedLoading ? (
              <p className={styles.alsoViewedEmpty}>More recommendations will appear here soon.</p>
            ) : null}
          </section>

          {/* Sticky Mobile Action Bar */}
          <div className={styles.mobileCta} aria-label="Product mobile actions">
            <button
              type="button"
              className={styles.mobileChat}
              onClick={() => void handleChatNow()}
              disabled={sendMessage.isPending}
              aria-label="Chat with seller"
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
              <span>Chat</span>
            </button>

            <button
              type="button"
              className={`${styles.mobileWishlist} ${isWishlisted ? styles.mobileWishlistActive : ''}`}
              onClick={() => void handleWishlistToggle()}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <span className={styles.mobileWishlistIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 20s-7-4.35-7-9.2A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7 3.7C19 15.65 12 20 12 20z"
                    fill={isWishlisted ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
            </button>

            <button
              type="button"
              className={styles.mobileBuy}
              disabled={isOutOfStock || addToCart.isPending}
              onClick={() => void handleAdd()}
            >
              <span className={styles.mobileBuyLabel}>
                {addToCart.isPending ? 'Adding…' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </span>
              <span className={styles.mobileBuyPrice}>
                {formatRwf(selected?.price || product.discountPrice || product.price)}
              </span>
            </button>
          </div>
        </>
      ) : null}

      {product && previewOpen ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview modal"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className={styles.lightboxInner}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.lightboxToolbar}>
              <div className={styles.lightboxInfo}>
                <span className={styles.lightboxTitle}>{product.name}</span>
                <span className={styles.lightboxCounter}>
                  Photo {activeImage + 1} of {images.length || 1}
                </span>
              </div>
              <div className={styles.lightboxControls}>
                <button
                  type="button"
                  className={`${styles.lightboxZoomBtn} ${isZoomed ? styles.lightboxZoomBtnActive : ''}`}
                  onClick={() => setIsZoomed((z) => !z)}
                  aria-label={isZoomed ? 'Zoom out (1x)' : 'Zoom in (2x)'}
                  title="Toggle zoom (or press Z)"
                >
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    {isZoomed ? (
                      <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    ) : (
                      <>
                        <line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </>
                    )}
                  </svg>
                  <span>{isZoomed ? '100%' : 'Zoom'}</span>
                </button>
                <button
                  type="button"
                  className={styles.lightboxClose}
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Close preview (Esc)"
                  title="Close preview (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={styles.lightboxStage}>
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

              <div
                className={`${styles.lightboxImageWrap} ${isZoomed ? styles.lightboxImageWrapZoomed : ''}`}
                onClick={() => setIsZoomed((z) => !z)}
                title={isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
              >
                <img
                  src={mainImage}
                  alt={mainAlt}
                  className={`${styles.lightboxImage} ${isZoomed ? styles.lightboxImageZoomed : ''}`}
                />
              </div>

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
            </div>

            {images.length > 1 ? (
              <div className={styles.lightboxFilmstrip} role="list" aria-label="Lightbox thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.url + index}
                    type="button"
                    className={
                      index === activeImage ? styles.lightboxThumbActive : styles.lightboxThumb
                    }
                    onClick={() => setActiveImage(index)}
                    aria-label={`Jump to photo ${index + 1}`}
                  >
                    <img src={image.url} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
