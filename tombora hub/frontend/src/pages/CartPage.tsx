import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddToWishlist,
  useCart,
  useCategories,
  useMe,
  useProducts,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/api/hooks';
import { Alert, Button, ProductGridSkeleton, useToast } from '@/components/ui';
import { CartLineItem, ProductCard } from '@/components/product';
import type { CartLine } from '@/components/product/CartLineItem';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './CartPage.module.css';

export function CartPage() {
  const { data: user, isLoading: isUserLoading } = useMe();
  const { data: cart, isLoading, isError, error } = useCart();
  const { data: categories } = useCategories();
  const { data: recommendedData } = useProducts({ limit: 4, sort: 'popular' });

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const addToWishlist = useAddToWishlist();
  const navigate = useNavigate();
  const toast = useToast();

  // Promo code local state
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscountPct, setPromoDiscountPct] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const subtotalNumber = Number(cart?.subtotal || '0');
  const discountAmount = Math.round(subtotalNumber * (promoDiscountPct / 100));
  const finalTotal = Math.max(0, subtotalNumber - discountAmount);

  const hasOutOfStock = (cart?.items || []).some((item) => (item.available ?? 0) < 1);
  const isBusy = updateItem.isPending || removeItem.isPending;

  const handleApplyPromo = (e: FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;
    if (clean === 'NEERE10' || clean === 'KIGALI10' || clean === 'WELCOME10') {
      setPromoDiscountPct(10);
      setPromoFeedback({ type: 'success', text: '10% promotional discount applied!' });
      toast.success('Promo code applied: 10% off');
    } else if (clean === 'RWANDA20' || clean === 'VIP20') {
      setPromoDiscountPct(20);
      setPromoFeedback({ type: 'success', text: '20% merchant partner discount applied!' });
      toast.success('Promo code applied: 20% off');
    } else {
      setPromoDiscountPct(0);
      setPromoFeedback({ type: 'error', text: 'Invalid or expired promotional code.' });
    }
  };

  const handleMoveToWishlist = async (item: CartLine) => {
    if (!item.variantId) {
      await removeItem.mutateAsync(item.id);
      return;
    }
    try {
      await addToWishlist.mutateAsync(item.variantId);
      await removeItem.mutateAsync(item.id);
      toast.success(`Saved "${item.productName}" to your wishlist`);
    } catch {
      toast.info('Please sign in to save items to your wishlist.');
    }
  };

  const handleRemoveAllOutOfStock = async () => {
    const oosItems = (cart?.items || []).filter((i) => (i.available ?? 0) < 1);
    for (const item of oosItems) {
      try {
        await removeItem.mutateAsync(item.id);
      } catch {
        // continue
      }
    }
    toast.info('Removed out-of-stock items.');
  };

  const hasToken = Boolean(localStorage.getItem('th_access_token'));

  // Loading state while verifying user session or fetching cart for logged-in user
  if (isUserLoading || (hasToken && isLoading)) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>Shopping Cart | NeereMarket</title>
        </Helmet>
        <div className={styles.stepsBar} aria-label="Checkout Progress">
          <div className={`${styles.step} ${styles.stepActive}`}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepLabel}>Shopping Cart</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepLabel}>Shipping & Address</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepLabel}>Payment & Confirm</span>
          </div>
        </div>
        <ProductGridSkeleton count={2} />
      </div>
    );
  }

  // Unauthenticated Guest View (only when auth query has completed and user is null)
  if (!user) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>Shopping Cart | NeereMarket</title>
        </Helmet>

        {/* 3-Step Checkout Bar */}
        <div className={styles.stepsBar} aria-label="Checkout Progress">
          <div className={`${styles.step} ${styles.stepActive}`}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepLabel}>Shopping Cart</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepLabel}>Shipping & Address</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepLabel}>Payment & Confirm</span>
          </div>
        </div>

        <div className={styles.guestCard}>
          <div className={styles.emptyIconCircle}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className={styles.emptyTitle}>Sign in to view your cart</h1>
          <p className={styles.emptyDesc}>
            Your multi-vendor shopping cart is saved to your account and synchronizes across all
            your devices.
          </p>
          <ul className={styles.guestBenefits}>
            <li>
              <span className={styles.checkIcon}>✓</span> Synchronize cart across phone, tablet, and
              laptop
            </li>
            <li>
              <span className={styles.checkIcon}>✓</span> Fast checkout with saved addresses across
              Rwanda
            </li>
            <li>
              <span className={styles.checkIcon}>✓</span> Direct messaging and escrow buyer
              protection
            </li>
          </ul>
          <div className={styles.emptyActions}>
            <Button size="md" onClick={() => navigate(loginHref('/cart'))}>
              Sign in to continue
            </Button>
            <Link to="/products" className={styles.secondaryWishlistBtn}>
              Browse products as guest
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`Shopping Cart (${cart?.itemCount ?? 0}) | NeereMarket`}</title>
      </Helmet>

      {/* 3-Step Checkout Bar */}
      <div className={styles.stepsBar} aria-label="Checkout Progress">
        <div className={`${styles.step} ${styles.stepActive}`}>
          <span className={styles.stepNum}>1</span>
          <span className={styles.stepLabel}>Shopping Cart</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <span className={styles.stepLabel}>Shipping & Address</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <span className={styles.stepLabel}>Payment & Confirm</span>
        </div>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>Shopping Cart</h1>
          {cart && cart.itemCount > 0 ? (
            <span className={styles.itemCountBadge}>
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
            </span>
          ) : null}
        </div>
        <Link to="/products" className={styles.continueLink}>
          ← Continue shopping
        </Link>
      </div>

      {/* Buyer Protection Banner */}
      <div className={styles.guaranteeBanner}>
        <div className={styles.guaranteeIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className={styles.guaranteeText}>
          <strong>NeereMarket Buyer Protection:</strong> All orders are held safely in escrow.
          100% refund guarantee if items are not delivered or not as described by Rwandan
          merchants.
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? <ProductGridSkeleton count={2} /> : null}

      {/* API Error Alert */}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {/* Out of Stock Notice */}
      {hasOutOfStock ? (
        <div className={styles.oosAlertWrap}>
          <div className={styles.oosAlertContent}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>One or more items in your cart are currently out of stock.</span>
          </div>
          <button
            type="button"
            className={styles.removeOosBtn}
            onClick={handleRemoveAllOutOfStock}
          >
            Remove out-of-stock items
          </button>
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && cart && cart.items.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconCircle}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Your shopping cart is empty</h2>
          <p className={styles.emptyDesc}>
            Looks like you haven't added anything yet. Discover verified Rwandan boutiques, artisan
            crafts, high-quality electronics, and everyday essentials.
          </p>
          <div className={styles.emptyActions}>
            <Link to="/products" className={styles.primaryShopBtn}>
              Start Shopping
            </Link>
            <Link to="/wishlist" className={styles.secondaryWishlistBtn}>
              View Saved Wishlist
            </Link>
          </div>

          {categories && categories.length > 0 ? (
            <div className={styles.categoryPillsWrap}>
              <p className={styles.categoryPillsLabel}>Popular Categories</p>
              <div className={styles.categoryPills}>
                {categories.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className={styles.categoryPill}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Cart Items & Summary Grid */}
      {cart && cart.items.length > 0 ? (
        <div className={styles.layout}>
          {/* Left Column: Multi-Vendor Seller Groups */}
          <div className={styles.cartList}>
            {cart.sellerGroups.map((group) => {
              const groupItems = cart.items.filter((i) => i.storeSlug === group.storeSlug);
              return (
                <section key={group.sellerId} className={styles.sellerCard}>
                  {/* Seller Header */}
                  <div className={styles.sellerHeader}>
                    <div className={styles.sellerInfo}>
                      <div className={styles.sellerShopIcon}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <Link
                        to={`/stores/${group.storeSlug}`}
                        className={styles.sellerNameLink}
                        title={`Visit ${group.storeName}`}
                      >
                        {group.storeName}
                      </Link>
                      <span className={styles.sellerBadge}>✓ Verified Store</span>
                    </div>
                    <span className={styles.sellerLocation}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Ships from Rwanda
                    </span>
                  </div>

                  {/* Line Items for this Seller */}
                  <div className={styles.sellerItemsWrap}>
                    {groupItems.map((item) => (
                      <CartLineItem
                        key={item.id}
                        item={item}
                        busy={isBusy}
                        onUpdateQty={(id, quantity) =>
                          updateItem.mutate({ itemId: id, quantity })
                        }
                        onRemove={(id) => removeItem.mutate(id)}
                        onMoveToWishlist={handleMoveToWishlist}
                      />
                    ))}
                  </div>

                  {/* Seller Footer */}
                  <div className={styles.sellerFooter}>
                    <p className={styles.sellerPkgNote}>
                      {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'} packaged
                      together
                    </p>
                    <p className={styles.sellerSubtotal}>
                      Seller subtotal: <strong>{formatRwf(group.subtotal)}</strong>
                    </p>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <aside className={styles.summaryCard} aria-label="Order summary">
            <div className={styles.summaryHeader}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <span className={styles.secureBadge}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Secure
              </span>
            </div>

            {/* Price Rows */}
            <div className={styles.summaryRows}>
              <p className={styles.summaryRow}>
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className={styles.summaryRowValue}>{formatRwf(cart.subtotal)}</span>
              </p>

              <p className={styles.summaryRow}>
                <span>Estimated Delivery</span>
                <span className={styles.summaryRowValue}>Calculated at checkout</span>
              </p>

              <p className={styles.summaryRow}>
                <span>Buyer Protection</span>
                <span className={styles.freeTag}>Included (FREE)</span>
              </p>

              {promoDiscountPct > 0 ? (
                <p className={styles.summaryRow} style={{ color: '#16a34a' }}>
                  <span>Promotional Discount ({promoDiscountPct}%)</span>
                  <span className={styles.summaryRowValue} style={{ color: '#16a34a' }}>
                    - {formatRwf(String(discountAmount))}
                  </span>
                </p>
              ) : null}
            </div>

            <div className={styles.summaryDivider} />

            {/* Promo Code Form */}
            <div className={styles.promoWrap}>
              <form className={styles.promoForm} onSubmit={handleApplyPromo}>
                <input
                  className={styles.promoInput}
                  placeholder="Enter promo code (e.g. NEERE10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  aria-label="Promotional Code"
                />
                <button type="submit" className={styles.promoBtn}>
                  Apply
                </button>
              </form>
              {promoFeedback ? (
                <p
                  className={`${styles.promoMessage} ${
                    promoFeedback.type === 'success' ? styles.promoSuccess : styles.promoError
                  }`}
                >
                  {promoFeedback.text}
                </p>
              ) : null}
            </div>

            <div className={styles.summaryDivider} />

            {/* Total Row */}
            <div className={styles.totalRow}>
              <div>
                <p className={styles.totalLabel}>Estimated Total</p>
                <span className={styles.totalSubtext}>VAT & local fees included</span>
              </div>
              <p className={styles.totalAmount}>{formatRwf(String(finalTotal))}</p>
            </div>

            {/* Primary Checkout CTA */}
            <Button
              type="button"
              size="md"
              className={styles.checkoutBtn}
              disabled={hasOutOfStock || isBusy}
              onClick={() => navigate('/checkout')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Proceed to Checkout</span>
              <span>→</span>
            </Button>

            {/* Accepted Payments Section */}
            <div className={styles.paymentSection}>
              <p className={styles.paymentTitle}>Accepted Payment Methods</p>
              <div className={styles.paymentBadges}>
                <span className={styles.payBadge}>MTN MoMo</span>
                <span className={styles.payBadge}>Airtel Money</span>
                <span className={styles.payBadge}>Visa</span>
                <span className={styles.payBadge}>Mastercard</span>
                <span className={styles.payBadge}>Cash on Delivery</span>
              </div>
            </div>

            {/* Reassurance Feature List */}
            <ul className={styles.securityNotes}>
              <li>
                <span>🛡️</span> 100% Money-back escrow guarantee
              </li>
              <li>
                <span>🚚</span> Tracked local delivery across Rwanda
              </li>
              <li>
                <span>💬</span> Direct merchant chat & dispute resolution
              </li>
            </ul>
          </aside>
        </div>
      ) : null}

      {/* Mobile Sticky Bottom Checkout Bar */}
      {cart && cart.items.length > 0 ? (
        <div className={styles.mobileBottomBar}>
          <div className={styles.mobileTotalWrap}>
            <span className={styles.mobileTotalLabel}>Total ({cart.itemCount} items)</span>
            <span className={styles.mobileTotalAmount}>{formatRwf(String(finalTotal))}</span>
          </div>
          <button
            type="button"
            className={styles.mobileCheckoutBtn}
            disabled={hasOutOfStock || isBusy}
            onClick={() => navigate('/checkout')}
          >
            Checkout ({cart.itemCount})
          </button>
        </div>
      ) : null}

      {/* Recommended Products Carousel / Cross-Sell */}
      {recommendedData?.items && recommendedData.items.length > 0 ? (
        <section className={styles.recommendSection}>
          <div className={styles.recommendHeader}>
            <h2 className={styles.recommendTitle}>You May Also Like</h2>
            <Link to="/products" className={styles.continueLink}>
              View all products →
            </Link>
          </div>
          <div className={styles.recommendGrid}>
            {recommendedData.items.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
