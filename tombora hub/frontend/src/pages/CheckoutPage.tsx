import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddresses,
  useCart,
  useCheckout,
  useCreateAddress,
  useMe,
  useMockPay,
  useVerifyPayment,
} from '@/api/hooks';
import { Alert, Button, EmptyState, Input } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './CheckoutPage.module.css';

function idempotencyKey() {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type PayMethod = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'MOCK';

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

const isDev = import.meta.env.DEV;

export function CheckoutPage() {
  const { data: user } = useMe();
  const { data: cart } = useCart();
  const { data: addresses } = useAddresses();
  const createAddress = useCreateAddress();
  const checkout = useCheckout();
  const verifyPayment = useVerifyPayment();
  const mockPay = useMockPay();
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

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Kigali City');
  const [district, setDistrict] = useState('Gasabo');
  const [landmark, setLandmark] = useState('');

  const selectedAddress = useMemo(
    () => addresses?.find((a) => a.id === addressId) || addresses?.[0],
    [addresses, addressId],
  );

  useEffect(() => {
    if (!selectedAddress?.phone || payerPhone) return;
    setPayerPhone(selectedAddress.phone);
  }, [selectedAddress, payerPhone]);

  const sellerCount = cart?.sellerGroups.length || 1;
  const deliveryFee = deliveryMethod === 'CUSTOMER_PICKUP' ? 0 : 2000 * sellerCount;
  const total = Number(cart?.subtotal || 0) + deliveryFee;
  const hasOutOfStock = (cart?.items || []).some((item) => (item.available ?? 0) < 1);

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
          setError(result.payment.failureReason || 'Payment was not completed.');
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

  if (!user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in to checkout"
          actionLabel="Log in"
          onAction={() => navigate(loginHref('/checkout'))}
        />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          title="Nothing to checkout"
          actionLabel="Go to cart"
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
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function placeOrder() {
    setError(null);
    const addr = addressId || selectedAddress?.id;
    if (!addr) {
      setError('Add a delivery address to continue.');
      setShowAddressForm(true);
      return;
    }
    const momoPhone = (payerPhone || selectedAddress?.phone || phone).trim();
    if (paymentMethod !== 'MOCK' && !momoPhone) {
      setError('Enter the Mobile Money number that will pay for this order.');
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

      if (paymentMethod === 'MOCK') {
        await mockPay.mutateAsync(result.order.id);
        navigate(`/orders/${result.order.id}`);
        return;
      }

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
        <title>Checkout | NeereMarket</title>
      </Helmet>
      <h1>Checkout</h1>
      <p className={styles.sub}>One checkout for all sellers — pay once with Mobile Money.</p>
      {hasOutOfStock ? (
        <Alert tone="error">
          Some items in your cart are out of stock. Update your cart before placing the order.
        </Alert>
      ) : null}
      {error && !pending ? <Alert tone="error">{error}</Alert> : null}

      <div className={styles.layout}>
        <div className={styles.steps}>
          <section>
            <h2>1. Delivery address</h2>
            {(addresses || []).length > 0 && !showAddressForm ? (
              <div className={styles.addressList}>
                {(addresses || []).map((a) => (
                  <label key={a.id} className={styles.choice}>
                    <input
                      type="radio"
                      name="address"
                      checked={(addressId || selectedAddress?.id) === a.id}
                      onChange={() => {
                        setAddressId(a.id);
                        setPayerPhone(a.phone);
                      }}
                    />
                    <span>
                      <strong>{a.fullName}</strong> — {a.phone}
                      <br />
                      {a.district}, {a.province}
                      {a.landmark ? ` · ${a.landmark}` : ''}
                    </span>
                  </label>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddressForm(true)}>
                  Add new address
                </Button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={saveAddress}>
                <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Input
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="078…"
                />
                <Input label="Province" value={province} onChange={(e) => setProvince(e.target.value)} required />
                <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                <Input
                  label="Landmark / KG address"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
                <Button type="submit" disabled={createAddress.isPending}>
                  Save address
                </Button>
              </form>
            )}
          </section>

          <section>
            <h2>2. Delivery method</h2>
            <label className={styles.choice}>
              <input
                type="radio"
                checked={deliveryMethod === 'SELLER_DELIVERY'}
                onChange={() => setDeliveryMethod('SELLER_DELIVERY')}
              />
              Seller delivery (2,000 RWF per seller)
            </label>
            <label className={styles.choice}>
              <input
                type="radio"
                checked={deliveryMethod === 'CUSTOMER_PICKUP'}
                onChange={() => setDeliveryMethod('CUSTOMER_PICKUP')}
              />
              Customer pickup (free)
            </label>
          </section>

          <section>
            <h2>3. Payment method</h2>
            <div className={styles.payGrid}>
              <button
                type="button"
                className={`${styles.payCard} ${paymentMethod === 'MTN_MOMO' ? styles.payCardOn : ''}`}
                onClick={() => setPaymentMethod('MTN_MOMO')}
              >
                <strong>MTN MoMo</strong>
                <span>078 / 079 — USSD PIN on your phone</span>
              </button>
              <button
                type="button"
                className={`${styles.payCard} ${paymentMethod === 'AIRTEL_MONEY' ? styles.payCardOn : ''}`}
                onClick={() => setPaymentMethod('AIRTEL_MONEY')}
              >
                <strong>Airtel Money</strong>
                <span>072 / 073 — USSD PIN on your phone</span>
              </button>
              {isDev ? (
                <button
                  type="button"
                  className={`${styles.payCard} ${paymentMethod === 'MOCK' ? styles.payCardOn : ''}`}
                  onClick={() => setPaymentMethod('MOCK')}
                >
                  <strong>Demo pay</strong>
                  <span>Instant confirm (development only)</span>
                </button>
              ) : null}
            </div>
            {paymentMethod !== 'MOCK' ? (
              <div className={styles.momoPhone}>
                <Input
                  label="Paying Mobile Money number"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="0780 000 000"
                  required
                />
                <p className={styles.hint}>
                  We send a {networkLabel} prompt to this number. Keep your phone unlocked and approve with
                  your PIN.
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className={styles.summary}>
          <h2>Review</h2>
          <p>
            <span>Subtotal</span>
            <strong>{formatRwf(cart.subtotal)}</strong>
          </p>
          <p>
            <span>Delivery</span>
            <strong>{formatRwf(deliveryFee)}</strong>
          </p>
          <p className={styles.total}>
            <span>Total</span>
            <strong>{formatRwf(total)}</strong>
          </p>
          <ul className={styles.sellers}>
            {cart.sellerGroups.map((g) => (
              <li key={g.sellerId}>
                {g.storeName}: {formatRwf(g.subtotal)}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            disabled={checkout.isPending || mockPay.isPending || hasOutOfStock || Boolean(pending)}
            onClick={() => void placeOrder()}
          >
            {checkout.isPending || mockPay.isPending ? 'Starting payment…' : 'Place order & pay'}
          </Button>
        </aside>
      </div>

      {pending ? (
        <div className={styles.payOverlay} role="dialog" aria-modal="true" aria-labelledby="pay-title">
          <div className={styles.paySheet}>
            <div className={styles.paySheetHead}>
              <p className={styles.payKicker}>Payment order</p>
              <h2 id="pay-title">{pending.instructions?.title || `Pay with ${networkLabel}`}</h2>
              <p>
                Order <strong>{pending.orderNumber}</strong> · {formatRwf(pending.amount)}
              </p>
            </div>

            <div className={styles.payPulse} data-state={payStatus} aria-hidden="true">
              <i />
            </div>

            {payStatus === 'paid' ? (
              <Alert tone="success">Payment confirmed. Opening your order…</Alert>
            ) : payStatus === 'failed' ? (
              <Alert tone="error">{error || 'Payment failed. You can try again from the order page.'}</Alert>
            ) : (
              <Alert tone="info">
                {pending.instructions?.message ||
                  `Approve the ${networkLabel} prompt on ${
                    pending.instructions?.phone || payerPhone
                  }. This page updates automatically.`}
              </Alert>
            )}

            <dl className={styles.payMeta}>
              <div>
                <dt>Network</dt>
                <dd>{networkLabel}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{pending.instructions?.phone || payerPhone}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {payStatus === 'checking'
                    ? 'Checking…'
                    : payStatus === 'paid'
                      ? 'Paid'
                      : payStatus === 'failed'
                        ? 'Failed'
                        : 'Waiting for PIN'}
                </dd>
              </div>
            </dl>

            <div className={styles.payActions}>
              {payStatus !== 'paid' ? (
                <Button
                  type="button"
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
                        setError(result.payment.failureReason || 'Payment was not completed.');
                      } else {
                        setPayStatus('waiting');
                      }
                    });
                  }}
                >
                  {verifyPayment.isPending ? 'Checking…' : 'I approved — check now'}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(`/orders/${pending.orderId}`)}
              >
                View order
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
