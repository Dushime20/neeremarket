import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddresses,
  useCart,
  useCheckout,
  useCreateAddress,
  useMe,
  useVerifyPayment,
} from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './CheckoutPage.module.css';

function idempotencyKey() {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type PayMethod = 'MTN_MOMO' | 'AIRTEL_MONEY';

type PendingPayment = {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  amount: string;
  method: PayMethod;
  instructions?: {
    title?: string;
    message?: string;
    network?: string;
    phone?: string;
  } | null;
};

const RWANDA_PROVINCES = [
  'Kigali City',
  'Northern Province',
  'Southern Province',
  'Eastern Province',
  'Western Province',
] as const;

export function CheckoutPage() {
  const { data: user, isLoading: isUserLoading } = useMe();
  const { data: cart, isLoading: isCartLoading } = useCart();
  const { data: addresses } = useAddresses();
  const createAddress = useCreateAddress();
  const checkout = useCheckout();
  const verifyPayment = useVerifyPayment();
  const navigate = useNavigate();

  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('MTN_MOMO');
  const [payerPhone, setPayerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'SELLER_DELIVERY' | 'CUSTOMER_PICKUP'>(
    'SELLER_DELIVERY',
  );
  const [error, setError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [payStatus, setPayStatus] = useState<'waiting' | 'checking' | 'paid' | 'failed'>('waiting');

  // Address creation form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState<string>('Kigali City');
  const [district, setDistrict] = useState('Gasabo');
  const [landmark, setLandmark] = useState('');

  const selectedAddress = useMemo(
    () => addresses?.find((a) => a.id === addressId) || addresses?.[0],
    [addresses, addressId],
  );

  // Auto-fill phone from selected address if empty
  useEffect(() => {
    if (!selectedAddress?.phone || payerPhone) return;
    setPayerPhone(selectedAddress.phone);
  }, [selectedAddress, payerPhone]);

  const sellerCount = cart?.sellerGroups.length || 1;
  const deliveryFee = deliveryMethod === 'CUSTOMER_PICKUP' ? 0 : 2000 * sellerCount;
  const total = Number(cart?.subtotal || 0) + deliveryFee;
  const hasOutOfStock = (cart?.items || []).some((item) => (item.available ?? 0) < 1);

  // Poll for payment confirmation when pending payment sheet is open
  useEffect(() => {
    if (!pending || payStatus === 'paid' || payStatus === 'failed') return;
    let cancelled = false;

    const tick = async () => {
      try {
        const result = await verifyPayment.mutateAsync(pending.paymentId);
        if (cancelled) return;
        if (result.payment.status === 'PAID') {
          setPayStatus('paid');
          window.setTimeout(() => navigate(`/orders/${pending.orderId}`), 900);
          return;
        }
        if (result.payment.status === 'FAILED' || result.payment.status === 'CANCELLED') {
          setPayStatus('failed');
          setError(result.payment.failureReason || 'Payment was not approved or timed out.');
        }
      } catch {
        /* keep waiting; user can tap check now */
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll while this payment sheet is open
  }, [pending?.paymentId]);

  const hasToken = Boolean(localStorage.getItem('th_access_token'));

  // Loading state while verifying user session or cart on page refresh
  if (isUserLoading || (hasToken && isCartLoading)) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>{`Checkout | NeereMarket`}</title>
        </Helmet>
        <div className={styles.stepsBar} aria-label="Checkout Progress">
          <div className={`${styles.step} ${styles.stepCompleted}`}>
            <span className={styles.stepNum}>✓</span>
            <span className={styles.stepLabel}>Shopping Cart</span>
          </div>
          <div className={`${styles.stepLine} ${styles.stepLineCompleted}`} />
          <div className={`${styles.step} ${styles.stepActive}`}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepLabel}>Shipping & Payment</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepLabel}>Confirmation</span>
          </div>
        </div>
        <ProductGridSkeleton count={2} />
      </div>
    );
  }

  // Unauthenticated Guest View
  if (!user) {
    return (
      <div className="container">
        <EmptyState
          title="Sign in to checkout"
          description="Your delivery addresses and order history are securely tied to your NeereMarket account."
          actionLabel="Log In"
          onAction={() => navigate(loginHref('/checkout'))}
        />
      </div>
    );
  }

  // Empty Cart View
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          title="Nothing to checkout"
          description="Your cart is currently empty. Explore verified Rwandan merchants to start shopping."
          actionLabel="Go to Cart"
          onAction={() => navigate('/cart')}
        />
      </div>
    );
  }

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const address = await createAddress.mutateAsync({
        fullName,
        phone,
        province,
        district,
        landmark,
        isDefault: true,
      });
      setAddressId(address.id);
      setPayerPhone(phone);
      setShowAddressForm(false);
      // Reset form fields
      setFullName('');
      setPhone('');
      setLandmark('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function placeOrder() {
    setError(null);
    const addr = addressId || selectedAddress?.id;
    if (!addr) {
      setError('Please select or add a delivery address to continue.');
      setShowAddressForm(true);
      return;
    }
    const momoPhone = (payerPhone || selectedAddress?.phone || phone).trim();
    if (!momoPhone) {
      setError('Please enter the Mobile Money phone number to authorize payment.');
      return;
    }
    try {
      const result = await checkout.mutateAsync({
        addressId: addr,
        deliveryMethod,
        paymentMethod,
        customerPhone: momoPhone,
        idempotencyKey: idempotencyKey(),
      });

      setPending({
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        paymentId: result.payment.id,
        amount: result.payment.amount || String(total),
        method: paymentMethod,
        instructions: result.payment.instructions,
      });
      setPayStatus('waiting');
    } catch (err) {
      setError(getErrorMessage(err, 'Checkout failed'));
    }
  }

  const networkLabel =
    pending?.instructions?.network ||
    (paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money' : 'MTN MoMo');

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`Checkout | NeereMarket`}</title>
      </Helmet>

      {/* 3-Step Checkout Funnel Bar */}
      <div className={styles.stepsBar} aria-label="Checkout Progress">
        <Link to="/cart" className={`${styles.step} ${styles.stepCompleted}`} title="Back to Cart">
          <span className={styles.stepNum}>✓</span>
          <span className={styles.stepLabel}>Shopping Cart</span>
        </Link>
        <div className={`${styles.stepLine} ${styles.stepLineCompleted}`} />
        <div className={`${styles.step} ${styles.stepActive}`}>
          <span className={styles.stepNum}>2</span>
          <span className={styles.stepLabel}>Shipping & Payment</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <span className={styles.stepLabel}>Confirmation</span>
        </div>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleRow}>
          <h1 className={styles.headerTitle}>Secure Checkout</h1>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#15803d' }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className={styles.headerSubtitle}>
          Unified multi-vendor checkout for Rwandan boutiques and merchants. One single payment with
          Mobile Money.
        </p>

        <div className={styles.trustStrip}>
          <span className={styles.trustItem}>
            <span className={styles.trustItemCheck}>✓</span> Escrow Payment Protection
          </span>
          <span className={styles.trustItem}>
            <span className={styles.trustItemCheck}>✓</span> Instant MoMo / Airtel Prompt
          </span>
          <span className={styles.trustItem}>
            <span className={styles.trustItemCheck}>✓</span> Verified Rwandan Merchants
          </span>
        </div>
      </div>

      {/* Out of Stock Alert */}
      {hasOutOfStock ? (
        <Alert tone="error">
          Some items in your cart are currently out of stock. Please update your cart before placing
          the order.
        </Alert>
      ) : null}

      {/* Error Alert */}
      {error && !pending ? <Alert tone="error">{error}</Alert> : null}

      {/* Main 2-Column Grid */}
      <div className={styles.layout}>
        {/* Left Column: Form Sections */}
        <div className={styles.sections}>
          {/* Section 1: Delivery Address */}
          <section className={styles.sectionCard} aria-labelledby="address-sec">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionBadge}>1</span>
                <h2 id="address-sec" className={styles.sectionTitle}>
                  Delivery Address
                </h2>
              </div>
              {!showAddressForm && (addresses || []).length > 0 ? (
                <button
                  type="button"
                  className={styles.newAddressBtn}
                  onClick={() => setShowAddressForm(true)}
                >
                  + Add new address
                </button>
              ) : null}
            </div>

            {/* Saved Address Cards */}
            {!showAddressForm && (addresses || []).length > 0 ? (
              <div className={styles.addressGrid}>
                {(addresses || []).map((addr) => {
                  const isSelected = (addressId || selectedAddress?.id) === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={`${styles.addressCard} ${
                        isSelected ? styles.addressCardSelected : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressSelection"
                        className={styles.addressRadio}
                        checked={isSelected}
                        onChange={() => {
                          setAddressId(addr.id);
                          setPayerPhone(addr.phone);
                        }}
                      />
                      <div className={styles.addressDetails}>
                        <div className={styles.addressNameRow}>
                          <span className={styles.addressName}>{addr.fullName}</span>
                          {addr.isDefault ? (
                            <span className={styles.defaultBadge}>Default</span>
                          ) : null}
                        </div>
                        <span className={styles.addressPhone}>{addr.phone}</span>
                        <span className={styles.addressLocation}>
                          {addr.district}, {addr.province}
                        </span>
                        {addr.landmark ? (
                          <span className={styles.addressLandmark}>{addr.landmark}</span>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {/* Address Creation Form (when adding new or when no addresses exist) */}
            {showAddressForm || (addresses || []).length === 0 ? (
              <form className={styles.addressForm} onSubmit={saveAddress}>
                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    Full Name
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. Marie Claire Uwase"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.fieldLabel}>
                    Phone Number
                    <input
                      className={styles.fieldInput}
                      placeholder="078X XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.fieldLabel}>
                    Province
                    <select
                      className={styles.fieldSelect}
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      required
                    >
                      {RWANDA_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.fieldLabel}>
                    District
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. Gasabo, Kicukiro, Nyarugenge"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                    />
                  </label>

                  <label className={`${styles.fieldLabel} ${styles.formFullWidth}`}>
                    Landmark / Street / KG Address
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. KG 123 St, near Kigali Heights or Kimironko Market"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />
                  </label>
                </div>

                <div className={styles.formActions}>
                  <Button type="submit" disabled={createAddress.isPending}>
                    {createAddress.isPending ? 'Saving…' : 'Save & Use This Address'}
                  </Button>
                  {(addresses || []).length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </section>

          {/* Section 2: Delivery Method */}
          <section className={styles.sectionCard} aria-labelledby="deliv-sec">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionBadge}>2</span>
                <h2 id="deliv-sec" className={styles.sectionTitle}>
                  Delivery Method
                </h2>
              </div>
            </div>

            <div className={styles.deliveryGrid}>
              {/* Option 1: Seller Delivery */}
              <label
                className={`${styles.deliveryCard} ${
                  deliveryMethod === 'SELLER_DELIVERY' ? styles.deliveryCardSelected : ''
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  className={styles.addressRadio}
                  checked={deliveryMethod === 'SELLER_DELIVERY'}
                  onChange={() => setDeliveryMethod('SELLER_DELIVERY')}
                />
                <div className={styles.deliveryIcon}>
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
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div className={styles.deliveryDetails}>
                  <div className={styles.deliveryTitleRow}>
                    <span className={styles.deliveryTitle}>Doorstep Courier Delivery</span>
                    <span className={styles.deliveryPrice}>
                      {formatRwf(2000 * sellerCount)}
                    </span>
                  </div>
                  <p className={styles.deliveryDesc}>
                    Delivered directly to your door by local Rwandan couriers. Flat 2,000 RWF per
                    merchant store ({sellerCount} {sellerCount === 1 ? 'store' : 'stores'}).
                  </p>
                </div>
              </label>

              {/* Option 2: Storefront Pickup */}
              <label
                className={`${styles.deliveryCard} ${
                  deliveryMethod === 'CUSTOMER_PICKUP' ? styles.deliveryCardSelected : ''
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  className={styles.addressRadio}
                  checked={deliveryMethod === 'CUSTOMER_PICKUP'}
                  onChange={() => setDeliveryMethod('CUSTOMER_PICKUP')}
                />
                <div className={styles.deliveryIcon}>
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
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className={styles.deliveryDetails}>
                  <div className={styles.deliveryTitleRow}>
                    <span className={styles.deliveryTitle}>Storefront Self Pickup</span>
                    <span className={styles.freeTag}>FREE</span>
                  </div>
                  <p className={styles.deliveryDesc}>
                    Pick up in person from the sellers’ boutique storefronts in Kigali with your
                    order confirmation code.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Section 3: Payment Method */}
          <section className={styles.sectionCard} aria-labelledby="pay-sec">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionBadge}>3</span>
                <h2 id="pay-sec" className={styles.sectionTitle}>
                  Mobile Money Payment
                </h2>
              </div>
            </div>

            {/* Payment Channel Cards */}
            <div className={styles.paymentGrid}>
              {/* MTN MoMo */}
              <button
                type="button"
                className={`${styles.paymentCard} ${
                  paymentMethod === 'MTN_MOMO' ? styles.paymentCardSelected : ''
                }`}
                onClick={() => setPaymentMethod('MTN_MOMO')}
              >
                <div className={`${styles.paymentLogoBox} ${styles.mtnLogo}`}>MoMo</div>
                <div className={styles.paymentCardText}>
                  <span className={styles.paymentMethodName}>MTN Mobile Money</span>
                  <span className={styles.paymentMethodPrefixes}>078 / 079 numbers</span>
                  <p className={styles.paymentMethodDesc}>
                    Instant prompt sent to your phone. Approve securely with your MTN MoMo PIN.
                  </p>
                </div>
              </button>

              {/* Airtel Money */}
              <button
                type="button"
                className={`${styles.paymentCard} ${
                  paymentMethod === 'AIRTEL_MONEY' ? styles.paymentCardSelected : ''
                }`}
                onClick={() => setPaymentMethod('AIRTEL_MONEY')}
              >
                <div className={`${styles.paymentLogoBox} ${styles.airtelLogo}`}>airtel</div>
                <div className={styles.paymentCardText}>
                  <span className={styles.paymentMethodName}>Airtel Money</span>
                  <span className={styles.paymentMethodPrefixes}>072 / 073 numbers</span>
                  <p className={styles.paymentMethodDesc}>
                    USSD push authorization prompt sent directly to your Airtel SIM.
                  </p>
                </div>
              </button>
            </div>

            {/* Paying Phone Number Box */}
            <div className={styles.phoneInputBox}>
              <label className={styles.phoneInputLabel} htmlFor="momo-phone-input">
                Paying {networkLabel} Phone Number
              </label>
              <div className={styles.phoneInputRow}>
                <div className={styles.countryCode} title="Rwanda Country Code">
                  <span>🇷🇼</span>
                  <span>+250</span>
                </div>
                <input
                  id="momo-phone-input"
                  className={styles.phoneInput}
                  placeholder="0780 000 000"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>
              <p className={styles.phoneHint}>
                🔔 When you click <strong>"Place Order & Pay"</strong>, an authorization prompt will
                appear on this phone. Keep your screen unlocked and approve using your PIN. Funds
                are held safely in escrow and only released after you confirm receiving your items.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Order Review Sidebar */}
        <aside className={styles.summaryCard} aria-label="Order summary review">
          <div className={styles.summaryHeader}>
            <h2 className={styles.summaryTitle}>Review Order</h2>
            <span className={styles.summaryItemsCount}>
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Mini Items Preview List */}
          <div className={styles.miniItemsWrap}>
            {cart.items.map((item) => (
              <div key={item.id} className={styles.miniItem}>
                <img
                  src={item.image || 'https://placehold.co/80x80/f1f5f9/64748b?text=Item'}
                  alt={item.productName}
                  className={styles.miniThumb}
                />
                <div className={styles.miniItemInfo}>
                  <p className={styles.miniItemName} title={item.productName}>
                    {item.productName}
                  </p>
                  <p className={styles.miniItemStore}>
                    Qty: {item.quantity} · {item.storeName}
                  </p>
                </div>
                <span className={styles.miniItemPrice}>{formatRwf(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className={styles.summaryDivider} />

          {/* Totals Breakdown */}
          <div className={styles.summaryRows}>
            <p className={styles.summaryRow}>
              <span>Subtotal</span>
              <span className={styles.summaryRowValue}>{formatRwf(cart.subtotal)}</span>
            </p>

            <p className={styles.summaryRow}>
              <span>Delivery Fee ({deliveryMethod === 'CUSTOMER_PICKUP' ? 'Pickup' : `${sellerCount} stores`})</span>
              <span className={styles.summaryRowValue}>
                {deliveryFee === 0 ? (
                  <span className={styles.freeTag}>FREE</span>
                ) : (
                  formatRwf(deliveryFee)
                )}
              </span>
            </p>

            <p className={styles.summaryRow}>
              <span>Escrow Buyer Protection</span>
              <span className={styles.freeTag}>Included (FREE)</span>
            </p>

            <div className={styles.summaryDivider} />

            <div className={styles.totalRow}>
              <div>
                <p className={styles.totalLabel}>Grand Total</p>
                <span className={styles.totalSubtext}>VAT & courier fees included</span>
              </div>
              <p className={styles.totalAmount}>{formatRwf(total)}</p>
            </div>
          </div>

          {/* Main CTA: Place Order & Pay */}
          <Button
            type="button"
            className={styles.placeOrderBtn}
            disabled={checkout.isPending || hasOutOfStock || Boolean(pending)}
            onClick={() => void placeOrder()}
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
            <span>
              {checkout.isPending ? 'Initiating payment…' : `Place Order & Pay (${formatRwf(total)})`}
            </span>
          </Button>

          {/* Security Features */}
          <ul className={styles.securityList}>
            <li>
              <span>🛡️</span> 100% money-back escrow protection
            </li>
            <li>
              <span>🔒</span> 256-bit encrypted telecom integration
            </li>
            <li>
              <span>💬</span> Direct merchant chat & dispute resolution
            </li>
          </ul>
        </aside>
      </div>

      {/* Payment Processing Sheet Modal */}
      {pending ? (
        <div
          className={styles.payOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-title"
        >
          <div className={styles.paySheet}>
            <div className={styles.paySheetHead}>
              <p className={styles.payKicker}>Live Payment Authorization</p>
              <h2 id="pay-title" className={styles.payTitle}>
                {pending.instructions?.title || `Approve with ${networkLabel}`}
              </h2>
              <p className={styles.payOrderMeta}>
                Order <strong>{pending.orderNumber}</strong> · Amount:{' '}
                <strong>{formatRwf(pending.amount)}</strong>
              </p>
            </div>

            {/* Pulsing Status Radar */}
            <div className={styles.payPulseBox}>
              <div className={styles.pulseRing}>
                <div
                  className={`${styles.pulseDot} ${
                    payStatus === 'paid'
                      ? styles.pulseDotPaid
                      : payStatus === 'failed'
                        ? styles.pulseDotFailed
                        : ''
                  }`}
                />
              </div>
            </div>

            {/* Dynamic Status Alert */}
            {payStatus === 'paid' ? (
              <Alert tone="success">Payment confirmed! Opening your order receipt…</Alert>
            ) : payStatus === 'failed' ? (
              <Alert tone="error">
                {error || 'Payment was not completed. You can try again or check your orders.'}
              </Alert>
            ) : (
              <Alert tone="info">
                {pending.instructions?.message ||
                  `A USSD prompt has been sent to ${
                    pending.instructions?.phone || payerPhone
                  }. Please enter your Mobile Money PIN on your phone.`}
              </Alert>
            )}

            {/* Instruction Steps */}
            <div className={styles.payInstructionSteps}>
              <ol>
                <li>Check your phone screen for the <strong>{networkLabel}</strong> prompt.</li>
                <li>Enter your Mobile Money PIN to authorize <strong>{formatRwf(pending.amount)}</strong>.</li>
                <li>Once approved, this page will automatically update and confirm your order.</li>
              </ol>
            </div>

            {/* Payment Metadata */}
            <dl className={styles.payMetaList}>
              <div className={styles.payMetaRow}>
                <dt>Network</dt>
                <dd>{networkLabel}</dd>
              </div>
              <div className={styles.payMetaRow}>
                <dt>Paying Phone</dt>
                <dd>{pending.instructions?.phone || payerPhone}</dd>
              </div>
              <div className={styles.payMetaRow}>
                <dt>Payment Status</dt>
                <dd>
                  {payStatus === 'checking'
                    ? 'Verifying…'
                    : payStatus === 'paid'
                      ? '✓ Paid & Confirmed'
                      : payStatus === 'failed'
                        ? '✕ Failed'
                        : '⏳ Waiting for PIN…'}
                </dd>
              </div>
            </dl>

            {/* Action Buttons */}
            <div className={styles.payActions}>
              {payStatus !== 'paid' ? (
                <button
                  type="button"
                  className={styles.checkStatusBtn}
                  disabled={verifyPayment.isPending}
                  onClick={() => {
                    setPayStatus('checking');
                    void verifyPayment.mutateAsync(pending.paymentId).then((result) => {
                      if (result.payment.status === 'PAID') {
                        setPayStatus('paid');
                        navigate(`/orders/${pending.orderId}`);
                      } else if (
                        result.payment.status === 'FAILED' ||
                        result.payment.status === 'CANCELLED'
                      ) {
                        setPayStatus('failed');
                        setError(result.payment.failureReason || 'Payment was not approved.');
                      } else {
                        setPayStatus('waiting');
                      }
                    });
                  }}
                >
                  {verifyPayment.isPending ? 'Verifying with network…' : 'I approved on my phone — Check now'}
                </button>
              ) : null}

              <button
                type="button"
                className={styles.cancelPayBtn}
                onClick={() => navigate(`/orders/${pending.orderId}`)}
              >
                View order details
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
