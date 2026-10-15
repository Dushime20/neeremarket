import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useConfirmDelivery, useMe, useMyDisputes, useOrder, useVerifyPayment } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, ProductGridSkeleton, useConfirm, useToast } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { disputeStatusLabel, disputeStatusTone, isDisputeActive } from '@/utils/disputes';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './OrderDetailPage.module.css';

const AWAITING_RECEIPT = ['SHIPPED', 'OUT_FOR_DELIVERY'];

interface OrderAddress {
  fullName?: string;
  phone?: string;
  province?: string;
  district?: string;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  street?: string | null;
  landmark?: string | null;
  kgAddress?: string | null;
  building?: string | null;
  apartment?: string | null;
  instructions?: string | null;
}

interface OrderItem {
  id?: string;
  productName: string;
  variantName?: string | null;
  sku?: string;
  quantity: number;
  unitPrice?: string;
  lineTotal: string;
}

interface SellerOrderRecord {
  id: string;
  sellerOrderNumber: string;
  sellerName: string;
  status: string;
  subtotal: string;
  deliveryFee: string;
  items: OrderItem[];
}

interface PaymentRecord {
  id: string;
  status: string;
  method: string;
  provider: string;
  amount: string;
  providerRef?: string | null;
  createdAt?: string;
}

function formatOrderDateTime(isoDate?: string) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

function formatMethodName(method?: string, provider?: string) {
  const m = (method || '').toUpperCase();
  const p = (provider || '').toUpperCase();
  if (m === 'MOMO' || m.includes('MOMO')) {
    if (p.includes('MTN')) return 'MTN Mobile Money';
    if (p.includes('AIRTEL')) return 'Airtel Money';
    return 'Mobile Money';
  }
  if (m === 'CARD') return 'Debit / Credit Card';
  if (m === 'CASH') return 'Cash on Delivery';
  return method ? method.replace(/_/g, ' ') : 'Mobile Money';
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: user, isLoading: isUserLoading } = useMe();
  const confirm = useConfirm();
  const toast = useToast();
  const { data: rawOrder, isLoading, isError, error, refetch } = useOrder(id);
  const { data: disputes } = useMyDisputes(undefined, !!user);
  const verifyPayment = useVerifyPayment();
  const confirmDelivery = useConfirmDelivery();

  const [deliveryMsg, setDeliveryMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const order = rawOrder as
    | {
        id: string;
        orderNumber: string;
        status: string;
        subtotal: string;
        deliveryFee: string;
        discountTotal: string;
        platformCharges: string;
        total: string;
        createdAt: string;
        paidAt?: string | null;
        address?: OrderAddress;
        sellerOrders?: SellerOrderRecord[];
        payments?: PaymentRecord[];
      }
    | undefined;

  const status = String(order?.status || '').toUpperCase();
  const payments = (order?.payments || []) as PaymentRecord[];
  const openPayment = payments.find((p) => p.status === 'PENDING' || p.status === 'INITIATED');
  const sellerOrders = (order?.sellerOrders || []) as SellerOrderRecord[];
  const address = order?.address as OrderAddress | undefined;

  const itemsTotal = Number(order?.subtotal || 0);
  const deliveryTotal = Number(order?.deliveryFee || 0);
  const discountTotal = Number(order?.discountTotal || 0);
  const platformCharges = Number(order?.platformCharges || 0);
  const grandTotal = Number(order?.total || 0);

  // Stepper calculations
  const isCancelled = status === 'CANCELLED' || status === 'FAILED' || status === 'REFUNDED';
  const isPaid = status !== 'PENDING_PAYMENT' && status !== 'UNPAID' && status !== 'INITIATED' && !isCancelled;
  const isShipped =
    isPaid &&
    (status === 'SHIPPED' ||
      status === 'OUT_FOR_DELIVERY' ||
      sellerOrders.some((so) => so.status === 'SHIPPED' || so.status === 'OUT_FOR_DELIVERY'));
  const isDelivered =
    status === 'DELIVERED' ||
    status === 'COMPLETED' ||
    (sellerOrders.length > 0 && sellerOrders.every((so) => so.status === 'DELIVERED'));

  const currentStep = useMemo(() => {
    if (isCancelled) return 0;
    if (isDelivered) return 4;
    if (isShipped) return 3;
    if (isPaid) return 2;
    return 1;
  }, [isCancelled, isDelivered, isShipped, isPaid]);

  const anyAwaitingReceipt = useMemo(() => {
    return sellerOrders.some((so) => AWAITING_RECEIPT.includes(so.status));
  }, [sellerOrders]);

  async function checkPayment() {
    if (!openPayment) return;
    try {
      const result = await verifyPayment.mutateAsync(openPayment.id);
      await refetch();
      if (result.payment.status === 'FAILED') {
        toast.error('Payment failed. Please try again or use another method.');
      } else if (result.payment.status === 'SUCCESS' || result.payment.status === 'COMPLETED') {
        toast.success('Payment verified successfully!');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not verify payment status'));
    }
  }

  async function onConfirmDelivery(sellerOrderId: string, label: string) {
    const ok = await confirm({
      title: 'Confirm Delivery Receipt',
      message: `Did you receive parcel ${label}? Confirming will release payment to the merchant.`,
      confirmText: 'Yes, I received it',
      cancelText: 'Not yet',
      tone: 'info',
    });
    if (!ok) return;

    setDeliveryMsg(null);
    try {
      await confirmDelivery.mutateAsync({ orderId: id, sellerOrderId });
      const msg = `Delivery of parcel ${label} confirmed. Thank you!`;
      setDeliveryMsg({ tone: 'success', text: msg });
      toast.success(msg);
      await refetch();
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not confirm delivery');
      setDeliveryMsg({ tone: 'error', text: msg });
      toast.error(msg);
    }
  }

  function handleCopyOrderNumber() {
    if (!order?.orderNumber) return;
    void navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    toast.success('Order number copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  }

  const hasToken = Boolean(localStorage.getItem('th_access_token'));

  // Loading state while verifying user session or fetching orders on page refresh
  if (isUserLoading || (hasToken && isLoading)) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>{`Order Details | NeereMarket`}</title>
        </Helmet>
        <div className={styles.topNav}>
          <Link to="/orders" className={styles.backBtn}>
            ← Back to Orders
          </Link>
        </div>
        <ProductGridSkeleton count={2} />
      </div>
    );
  }

  // Unauthenticated Guest View
  if (!user) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <EmptyState
          title="Sign in to view order details"
          description="Your order tracking, receipt, and merchant communication are linked to your account."
          actionLabel="Log In"
          onAction={() => navigate(loginHref(`/orders/${id}`))}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.topNav}>
          <Link to="/orders" className={styles.backBtn}>
            ← Back to Orders
          </Link>
        </div>
        <Alert tone="error">{getErrorMessage(error, 'Could not load order details')}</Alert>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`Order ${String(order.orderNumber)} | NeereMarket`}</title>
      </Helmet>

      {/* ── Top Navigation Bar ── */}
      <nav className={styles.topNav} aria-label="Order navigation">
        <Link to="/orders" className={styles.backBtn}>
          <span aria-hidden="true">←</span> Back to Orders
        </Link>
        <div className={styles.navActions}>
          <button
            type="button"
            className={`${styles.copyOrderBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopyOrderNumber}
            title="Copy order number"
          >
            <span aria-hidden="true">{copied ? '✓' : '📋'}</span>
            {copied ? 'Copied' : 'Copy Order #'}
          </button>
        </div>
      </nav>

      {/* ── Hero Order Card ── */}
      <header className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.orderBadgeRow}>
            <h1 className={styles.orderNumber}>{order.orderNumber}</h1>
            <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
          </div>
          <p className={styles.orderDate}>
            Placed on {formatOrderDateTime(order.createdAt)}
          </p>
        </div>

        <div className={styles.heroTotalBox}>
          <span className={styles.heroTotalLabel}>Total Amount</span>
          <span className={styles.heroTotalAmount}>{formatRwf(grandTotal)}</span>
        </div>
      </header>

      {/* ── Visual Order Stepper (Mobile First) ── */}
      {isCancelled ? (
        <section className={styles.cancelledCard} aria-label="Order cancellation notice">
          <div className={styles.cancelledIcon} aria-hidden="true">
            ⚠️
          </div>
          <div className={styles.cancelledContent}>
            <h3>Order {prettyStatus(order.status)}</h3>
            <p>
              This order has been cancelled. Any collected funds are processed according to our
              escrow refund policy.
            </p>
          </div>
        </section>
      ) : (
        <section className={styles.stepperCard} aria-label="Order progress">
          <h2 className={styles.stepperTitle}>Order Status</h2>
          <div className={styles.stepper}>
            {/* Step 1: Placed */}
            <div
              className={`${styles.stepItem} ${
                currentStep >= 1 ? (currentStep > 1 ? styles.stepCompleted : styles.stepActive) : ''
              }`}
            >
              <div className={styles.stepIconWrap} aria-hidden="true">
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className={styles.stepLabel}>Placed</span>
              <div
                className={`${styles.stepBar} ${currentStep > 1 ? styles.stepBarFilled : ''}`}
                aria-hidden="true"
              />
            </div>

            {/* Step 2: Payment */}
            <div
              className={`${styles.stepItem} ${
                currentStep >= 2 ? (currentStep > 2 ? styles.stepCompleted : styles.stepActive) : ''
              }`}
            >
              <div className={styles.stepIconWrap} aria-hidden="true">
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span className={styles.stepLabel}>
                {status === 'PENDING_PAYMENT' ? 'Pending' : 'Paid'}
              </span>
              <div
                className={`${styles.stepBar} ${currentStep > 2 ? styles.stepBarFilled : ''}`}
                aria-hidden="true"
              />
            </div>

            {/* Step 3: Shipped / In Transit */}
            <div
              className={`${styles.stepItem} ${
                currentStep >= 3 ? (currentStep > 3 ? styles.stepCompleted : styles.stepActive) : ''
              }`}
            >
              <div className={styles.stepIconWrap} aria-hidden="true">
                {currentStep > 3 ? '✓' : '3'}
              </div>
              <span className={styles.stepLabel}>Shipped</span>
              <div
                className={`${styles.stepBar} ${currentStep > 3 ? styles.stepBarFilled : ''}`}
                aria-hidden="true"
              />
            </div>

            {/* Step 4: Delivered */}
            <div
              className={`${styles.stepItem} ${
                currentStep >= 4 ? styles.stepCompleted : ''
              }`}
            >
              <div className={styles.stepIconWrap} aria-hidden="true">
                {currentStep >= 4 ? '✓' : '4'}
              </div>
              <span className={styles.stepLabel}>Delivered</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Pending Payment Attention Alert ── */}
      {status === 'PENDING_PAYMENT' && openPayment ? (
        <section className={styles.attentionCard} aria-label="Pending payment instructions">
          <div className={styles.attentionHead}>
            <Badge tone="warning">Payment Required</Badge>
            <h3 className={styles.attentionTitle}>
              {formatMethodName(openPayment.method, openPayment.provider)} Confirmation
            </h3>
          </div>
          <p className={styles.attentionText}>
            We are waiting for your mobile money approval. Please check your phone, enter your PIN
            to confirm <strong>{formatRwf(openPayment.amount)}</strong>, then tap the button below.
          </p>
          <div className={styles.attentionActions}>
            <Button
              type="button"
              disabled={verifyPayment.isPending}
              onClick={() => void checkPayment()}
            >
              {verifyPayment.isPending ? 'Verifying payment…' : 'Check Payment Status'}
            </Button>
          </div>
        </section>
      ) : null}

      {/* ── Delivery Confirmation Prompt ── */}
      {anyAwaitingReceipt ? (
        <section className={styles.attentionCard} aria-label="Delivery confirmation required">
          <div className={styles.attentionHead}>
            <Badge tone="brand">Out for Delivery</Badge>
            <h3 className={styles.attentionTitle}>Parcels Arriving Soon</h3>
          </div>
          <p className={styles.attentionText}>
            One or more packages are currently in transit. Once you receive each package and verify
            its contents, tap <strong>"I Received This Parcel"</strong> below to release payment to
            the merchant.
          </p>
        </section>
      ) : null}

      {deliveryMsg ? <Alert tone={deliveryMsg.tone}>{deliveryMsg.text}</Alert> : null}

      {/* ── Main Responsive Layout (1-Col Mobile, 2-Col Desktop) ── */}
      <div className={styles.layout}>
        {/* ── LEFT / MAIN COLUMN: Packages, Address, Escrow ── */}
        <div className={styles.mainColumn}>
          {/* Multi-Vendor Packages Section */}
          <section aria-label="Seller packages">
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">📦</span> Parcels from Sellers ({sellerOrders.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sellerOrders.map((so) => {
                const parcelDisputes = (disputes || []).filter(
                  (d) => d.sellerOrderNumber === so.sellerOrderNumber,
                );
                const activeDispute = parcelDisputes.find((d) => isDisputeActive(d.status));
                const latestDispute = activeDispute || parcelDisputes[0];
                const canConfirm = AWAITING_RECEIPT.includes(so.status) && !activeDispute;

                return (
                  <article key={so.sellerOrderNumber} className={styles.sellerCard}>
                    {/* Seller Header */}
                    <header className={styles.sellerHead}>
                      <div className={styles.sellerStoreLine}>
                        <h3 className={styles.sellerStoreName}>
                          <span aria-hidden="true">🏬</span> {so.sellerName}
                        </h3>
                        <span className={styles.sellerOrderNumber}>{so.sellerOrderNumber}</span>
                      </div>
                      <div className={styles.parcelBadges}>
                        <Badge tone={statusTone(so.status)}>{prettyStatus(so.status)}</Badge>
                        {latestDispute ? (
                          <Badge tone={disputeStatusTone(latestDispute.status)}>
                            Dispute: {disputeStatusLabel(latestDispute.status)}
                          </Badge>
                        ) : null}
                      </div>
                    </header>

                    {/* Dispute Banner if active */}
                    {activeDispute ? (
                      <div className={styles.disputeBanner}>
                        <span className={styles.disputeBannerText}>
                          Dispute #{activeDispute.disputeNumber} active ({disputeStatusLabel(activeDispute.status)})
                        </span>
                        <Link to={`/disputes/${activeDispute.id}`} className={styles.disputeActionLink}>
                          View Dispute Details →
                        </Link>
                      </div>
                    ) : null}

                    {/* Items List */}
                    <ul className={styles.itemsList} aria-label={`Items from ${so.sellerName}`}>
                      {so.items.map((item, idx) => (
                        <li key={`${so.sellerOrderNumber}-${idx}`} className={styles.itemRow}>
                          <div className={styles.itemInfo}>
                            <p className={styles.itemName}>{item.productName}</p>
                            <div className={styles.itemMeta}>
                              <span className={styles.itemQtyBadge}>Qty: {item.quantity}</span>
                              {item.variantName ? <span>Variant: {item.variantName}</span> : null}
                              {item.sku ? <span>SKU: {item.sku}</span> : null}
                              {item.unitPrice ? <span>@ {formatRwf(item.unitPrice)}</span> : null}
                            </div>
                          </div>
                          <p className={styles.itemLineTotal}>{formatRwf(item.lineTotal)}</p>
                        </li>
                      ))}
                    </ul>

                    {/* Parcel Totals */}
                    <dl className={styles.parcelTotals}>
                      <div>
                        <dt>Items subtotal</dt>
                        <dd>{formatRwf(so.subtotal)}</dd>
                      </div>
                      <div>
                        <dt>Shipping from {so.sellerName}</dt>
                        <dd>{Number(so.deliveryFee) > 0 ? formatRwf(so.deliveryFee) : 'Free'}</dd>
                      </div>
                      <div className={styles.parcelTotalLine}>
                        <dt>Parcel Total</dt>
                        <dd>{formatRwf(Number(so.subtotal) + Number(so.deliveryFee || 0))}</dd>
                      </div>
                    </dl>

                    {/* Actions per parcel */}
                    <footer className={styles.parcelActions}>
                      {canConfirm ? (
                        <Button
                          type="button"
                          className={styles.confirmDeliveryBtn}
                          disabled={confirmDelivery.isPending}
                          onClick={() => void onConfirmDelivery(so.id, so.sellerOrderNumber)}
                        >
                          {confirmDelivery.isPending ? 'Confirming…' : '✓ I Received This Parcel'}
                        </Button>
                      ) : null}

                      {!activeDispute ? (
                        <Link
                          to={`/disputes/new?orderId=${encodeURIComponent(id)}&sellerOrderId=${encodeURIComponent(so.id)}`}
                        >
                          <Button type="button" size="sm" variant="ghost">
                            Report a Problem
                          </Button>
                        </Link>
                      ) : null}
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Delivery Address & Recipient Card */}
          {address ? (
            <section className={styles.addressCard} aria-label="Delivery information">
              <h2 className={styles.sectionTitle}>
                <span aria-hidden="true">📍</span> Delivery Address
              </h2>
              {address.fullName ? (
                <p className={styles.recipientName}>{address.fullName}</p>
              ) : null}
              {address.phone ? (
                <div className={styles.phoneWrap}>
                  <a href={`tel:${address.phone}`} className={styles.phoneLink}>
                    <span aria-hidden="true">📞</span> {address.phone}
                  </a>
                </div>
              ) : null}
              <div className={styles.addressLines}>
                <span className={styles.addressDistrict}>
                  {[address.district, address.province].filter(Boolean).join(', ')}
                </span>
                <span className={styles.addressDetails}>
                  {[
                    address.street,
                    address.landmark ? `Near: ${address.landmark}` : null,
                    address.sector ? `Sector: ${address.sector}` : null,
                    address.cell ? `Cell: ${address.cell}` : null,
                    address.village ? `Village: ${address.village}` : null,
                    address.kgAddress ? `KG: ${address.kgAddress}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              {address.instructions ? (
                <p className={styles.addressInstructions}>
                  <strong>Note for driver:</strong> {address.instructions}
                </p>
              ) : null}
            </section>
          ) : null}

          {/* NeereMarket Buyer Escrow Assurance */}
          <section className={styles.escrowCard} aria-label="NeereMarket buyer protection">
            <div className={styles.escrowIcon} aria-hidden="true">
              🛡️
            </div>
            <div className={styles.escrowText}>
              <h4>NeereMarket Escrow Protection</h4>
              <p>
                Your payment is safely held in escrow and is only released to each seller after you
                confirm satisfactory delivery. If an item is delayed, damaged, or not as described,
                open a dispute to receive a full refund or replacement.
              </p>
            </div>
          </section>
        </div>

        {/* ── RIGHT / SIDEBAR COLUMN: Summary, Payment, Support ── */}
        <aside className={styles.sideColumn} aria-label="Order summary and payment details">
          {/* Order Financial Breakdown */}
          <section className={styles.summaryCard} aria-label="Financial breakdown">
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">💳</span> Order Summary
            </h2>
            <dl className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <dt>Items Subtotal</dt>
                <dd>{formatRwf(itemsTotal)}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>
                  Shipping
                  {sellerOrders.length > 1 ? ` (${sellerOrders.length} sellers)` : ''}
                </dt>
                <dd>{deliveryTotal > 0 ? formatRwf(deliveryTotal) : 'Free'}</dd>
              </div>
              {discountTotal > 0 ? (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <dt>Discount</dt>
                  <dd>-{formatRwf(discountTotal)}</dd>
                </div>
              ) : null}
              {platformCharges > 0 ? (
                <div className={styles.summaryRow}>
                  <dt>Service Fee</dt>
                  <dd>{formatRwf(platformCharges)}</dd>
                </div>
              ) : null}
              <div className={styles.summaryTotalRow}>
                <dt>Grand Total</dt>
                <dd>{formatRwf(grandTotal)}</dd>
              </div>
            </dl>
          </section>

          {/* Payment Method & Transactions */}
          <section className={styles.paymentCard} aria-label="Payment method">
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">📱</span> Payment Details
            </h2>
            {payments.length > 0 ? (
              payments.map((p, idx) => (
                <div key={p.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentLabel}>Method</span>
                    <span className={styles.paymentValue}>
                      {formatMethodName(p.method, p.provider)}
                    </span>
                  </div>
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentLabel}>Status</span>
                    <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                  </div>
                  {p.providerRef ? (
                    <div className={styles.paymentRow}>
                      <span className={styles.paymentLabel}>Ref #</span>
                      <span className={styles.paymentValue} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem' }}>
                        {p.providerRef}
                      </span>
                    </div>
                  ) : null}
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentLabel}>Amount</span>
                    <span className={styles.paymentValue}>{formatRwf(p.amount)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Method</span>
                <span className={styles.paymentValue}>Mobile Money</span>
              </div>
            )}
          </section>

          {/* Support & Dispute Resolution */}
          <section className={styles.helpCard} aria-label="Customer support">
            <h4>Need Help With This Order?</h4>
            <p>
              Having issues with shipment delays, damaged items, or seller communication? Our team
              is ready to assist.
            </p>
            <div className={styles.helpLinks}>
              <Link to="/disputes" className={styles.helpLink}>
                → Open Resolution Center
              </Link>
              <Link to="/contact" className={styles.helpLink}>
                → Contact NeereMarket Support
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
