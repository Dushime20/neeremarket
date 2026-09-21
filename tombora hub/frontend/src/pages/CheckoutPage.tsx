import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddresses,
  useCart,
  useCheckout,
  useCreateAddress,
  useMe,
  useMockPay,
} from '@/api/hooks';
import { Alert, Button, EmptyState, Input } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './CheckoutPage.module.css';

function idempotencyKey() {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function CheckoutPage() {
  const { data: user } = useMe();
  const { data: cart } = useCart();
  const { data: addresses } = useAddresses();
  const createAddress = useCreateAddress();
  const checkout = useCheckout();
  const mockPay = useMockPay();
  const navigate = useNavigate();

  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MOCK' | 'MTN_MOMO' | 'AIRTEL_MONEY'>(
    'MOCK',
  );
  const [deliveryMethod, setDeliveryMethod] = useState<'SELLER_DELIVERY' | 'CUSTOMER_PICKUP'>(
    'SELLER_DELIVERY',
  );
  const [error, setError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Kigali City');
  const [district, setDistrict] = useState('Gasabo');
  const [landmark, setLandmark] = useState('');

  const selectedAddress = useMemo(
    () => addresses?.find((a) => a.id === addressId) || addresses?.[0],
    [addresses, addressId],
  );

  const sellerCount = cart?.sellerGroups.length || 1;
  const deliveryFee = deliveryMethod === 'CUSTOMER_PICKUP' ? 0 : 2000 * sellerCount;
  const total = Number(cart?.subtotal || 0) + deliveryFee;
  const hasOutOfStock = (cart?.items || []).some((item) => (item.available ?? 0) < 1);

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
    try {
      const result = await checkout.mutateAsync({
        addressId: addr,
        deliveryMethod,
        paymentMethod,
        customerPhone: selectedAddress?.phone || phone,
        idempotencyKey: idempotencyKey(),
      });

      if (paymentMethod === 'MOCK') {
        await mockPay.mutateAsync(result.order.id);
      }

      navigate(`/orders/${result.order.id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Checkout failed'));
    }
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>Checkout | NeereMarket</title>
      </Helmet>
      <h1>Checkout</h1>
      <p className={styles.sub}>One checkout for all sellers — orders split automatically.</p>
      {hasOutOfStock ? (
        <Alert tone="error">
          Some items in your cart are out of stock. Update your cart before placing the order.
        </Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

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
                      onChange={() => setAddressId(a.id)}
                    />
                    <span>
                      <strong>{a.fullName}</strong> — {a.phone}
                      <br />
                      {a.district}, {a.province}
                      {a.landmark ? ` Â· ${a.landmark}` : ''}
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
                <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+2507…" />
                <Input label="Province" value={province} onChange={(e) => setProvince(e.target.value)} required />
                <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                <Input label="Landmark / KG address" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
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
            <label className={styles.choice}>
              <input
                type="radio"
                checked={paymentMethod === 'MOCK'}
                onChange={() => setPaymentMethod('MOCK')}
              />
              Demo payment (instant confirm)
            </label>
            <label className={styles.choice}>
              <input
                type="radio"
                checked={paymentMethod === 'MTN_MOMO'}
                onChange={() => setPaymentMethod('MTN_MOMO')}
              />
              MTN Mobile Money
            </label>
            <label className={styles.choice}>
              <input
                type="radio"
                checked={paymentMethod === 'AIRTEL_MONEY'}
                onChange={() => setPaymentMethod('AIRTEL_MONEY')}
              />
              Airtel Money
            </label>
            <p className={styles.hint}>
              MoMo/Airtel use the PaymentProvider abstraction. Live credentials can be plugged in
              without rewriting checkout.
            </p>
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
            disabled={checkout.isPending || mockPay.isPending || hasOutOfStock}
            onClick={() => void placeOrder()}
          >
            {checkout.isPending || mockPay.isPending ? 'Processing…' : 'Place order'}
          </Button>
        </aside>
      </div>
    </div>
  );
}
