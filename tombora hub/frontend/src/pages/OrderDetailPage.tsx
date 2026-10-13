import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useConfirmDelivery, useMe, useMyDisputes, useOrder, useVerifyPayment } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, ProductGridSkeleton, useConfirm, useToast } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { disputeStatusLabel, disputeStatusTone, isDisputeActive } from '@/utils/disputes';
import { prettyStatus } from '@/utils/status';
import styles from './OrderDetailPage.module.css';

const AWAITING_RECEIPT = ['SHIPPED', 'OUT_FOR_DELIVERY'];

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: user } = useMe();
  const confirm = useConfirm();
  const toast = useToast();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const { data: disputes } = useMyDisputes(undefined, !!user);
  const verifyPayment = useVerifyPayment();
  const confirmDelivery = useConfirmDelivery();
  const [deliveryMsg, setDeliveryMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in required"
          actionLabel="Log in"
          onAction={() => navigate(loginHref(`/orders/${id}`))}
        />
      </div>
    );
  }

  const status = String(order?.status || '');
  const payments = (order?.payments || []) as Array<{
    id: string;
    status: string;
    method: string;
    provider: string;
    amount: string;
    providerRef?: string | null;
  }>;
  const openPayment = payments.find((p) => p.status === 'PENDING' || p.status === 'INITIATED');
  const sellerOrders = (order?.sellerOrders || []) as Array<{
    id: string;
    sellerOrderNumber: string;
    sellerName: string;
    status: string;
    subtotal: string;
    deliveryFee: string;
    items: Array<{ productName: string; quantity: number; lineTotal: string }>;
  }>;
  const itemsTotal = Number(order?.subtotal || 0);
  const deliveryTotal = Number(order?.deliveryFee || 0);
  const discountTotal = Number(order?.discountTotal || 0);
  const platformCharges = Number(order?.platformCharges || 0);

  async function checkPayment() {
    if (!openPayment) return;
    try {
      const result = await verifyPayment.mutateAsync(openPayment.id);
      await refetch();
      if (result.payment.status === 'FAILED') {
        // surfaced via refetch status
      }
    } catch {
      /* ignore; alert shows on next render if needed */
    }
  }

  async function onConfirmDelivery(sellerOrderId: string, label: string) {
    const ok = await confirm({
      title: 'Confirm delivery receipt',
      message: `Confirm you received ${label}? This confirms successful delivery and releases payment to the seller.`,
      confirmText: 'Yes, I received it',
      cancelText: 'Not yet',
      tone: 'info',
    });
    if (!ok) return;

    setDeliveryMsg(null);
    try {
      await confirmDelivery.mutateAsync({ orderId: id, sellerOrderId });
      const msg = `Thanks! Delivery of ${label} is confirmed.`;
      setDeliveryMsg({ tone: 'success', text: msg });
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not confirm delivery');
      setDeliveryMsg({ tone: 'error', text: msg });
      toast.error(msg);
    }
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{order ? `Order ${String(order.orderNumber)}` : 'Order'} | NeereMarket</title>
      </Helmet>
      <p>
        <Link to="/orders">← All orders</Link>
      </p>
      {isLoading ? <ProductGridSkeleton count={2} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {order ? (
        <>
          <header className={styles.header}>
            <div>
              <h1>{String(order.orderNumber)}</h1>
              <Badge>{status}</Badge>
            </div>
            <div className={styles.totals}>
              <p className={styles.total}>{formatRwf(String(order.total))}</p>
              <dl className={styles.breakdown}>
                <div>
                  <dt>Items</dt>
                  <dd>{formatRwf(itemsTotal)}</dd>
                </div>
                <div>
                  <dt>
                    Delivery
                    {sellerOrders.length > 1 ? ` (${sellerOrders.length} sellers)` : ''}
                  </dt>
                  <dd>{deliveryTotal > 0 ? formatRwf(deliveryTotal) : 'Free'}</dd>
                </div>
                {discountTotal > 0 ? (
                  <div>
                    <dt>Discount</dt>
                    <dd>-{formatRwf(discountTotal)}</dd>
                  </div>
                ) : null}
                {platformCharges > 0 ? (
                  <div>
                    <dt>Service fee</dt>
                    <dd>{formatRwf(platformCharges)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </header>
          {sellerOrders.length > 1 && deliveryTotal > 0 ? (
            <p className={styles.helpNote}>
              Each seller ships from their own location, so delivery is charged per seller.
            </p>
          ) : null}

          {status === 'PENDING_PAYMENT' && openPayment ? (
            <div className={styles.payBox}>
              <Alert tone="info">
                Waiting for Mobile Money confirmation. Approve the prompt on your phone, then check
                payment status here.
              </Alert>
              <div className={styles.payActions}>
                <Button
                  type="button"
                  disabled={verifyPayment.isPending}
                  onClick={() => void checkPayment()}
                >
                  {verifyPayment.isPending ? 'Checking…' : 'Check payment status'}
                </Button>
              </div>
            </div>
          ) : null}

          {deliveryMsg ? <Alert tone={deliveryMsg.tone}>{deliveryMsg.text}</Alert> : null}

          {sellerOrders.map((so) => {
            const parcelDisputes = (disputes || []).filter(
              (d) => d.sellerOrderNumber === so.sellerOrderNumber,
            );
            const activeDispute = parcelDisputes.find((d) => isDisputeActive(d.status));
            const latestDispute = activeDispute || parcelDisputes[0];
            return (
              <section key={so.sellerOrderNumber} className={styles.sellerOrder}>
                <div className={styles.sellerOrderHead}>
                  <h2>
                    {so.sellerOrderNumber} · {so.sellerName}
                  </h2>
                  {activeDispute ? (
                    <Link to={`/disputes/${activeDispute.id}`} className={styles.disputeLink}>
                      View dispute {activeDispute.disputeNumber}
                    </Link>
                  ) : (
                    <Link
                      to={`/disputes/new?orderId=${encodeURIComponent(id)}&sellerOrderId=${encodeURIComponent(so.id)}`}
                    >
                      <Button type="button" size="sm" variant="ghost">
                        Report a problem
                      </Button>
                    </Link>
                  )}
                </div>
                {AWAITING_RECEIPT.includes(so.status) && !activeDispute ? (
                  <div className={styles.payBox}>
                    <Alert tone="info">
                      This parcel is on its way. Once it arrives and everything is fine, confirm
                      delivery so the seller gets paid.
                    </Alert>
                    <div className={styles.payActions}>
                      <Button
                        type="button"
                        disabled={confirmDelivery.isPending}
                        onClick={() => void onConfirmDelivery(so.id, so.sellerOrderNumber)}
                      >
                        {confirmDelivery.isPending ? 'Confirming…' : 'I received this parcel'}
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className={styles.badges}>
                  <Badge tone="muted">{prettyStatus(so.status)}</Badge>
                  {latestDispute ? (
                    <Badge tone={disputeStatusTone(latestDispute.status)}>
                      Dispute: {disputeStatusLabel(latestDispute.status)}
                    </Badge>
                  ) : null}
                </div>
                <ul>
                  {so.items.map((item, idx) => (
                    <li key={`${so.sellerOrderNumber}-${idx}`}>
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <strong>{formatRwf(item.lineTotal)}</strong>
                    </li>
                  ))}
                </ul>
                <dl className={styles.parcelTotals}>
                  <div>
                    <dt>Items</dt>
                    <dd>{formatRwf(so.subtotal)}</dd>
                  </div>
                  <div>
                    <dt>Delivery from {so.sellerName}</dt>
                    <dd>{Number(so.deliveryFee) > 0 ? formatRwf(so.deliveryFee) : 'Free'}</dd>
                  </div>
                  <div className={styles.parcelTotal}>
                    <dt>Parcel total</dt>
                    <dd>{formatRwf(Number(so.subtotal) + Number(so.deliveryFee || 0))}</dd>
                  </div>
                </dl>
              </section>
            );
          })}
          <p className={styles.helpNote}>
            Your payment is held by NeereMarket and only released to each seller after you confirm
            that parcel was delivered. Delivery late or something wrong with a parcel? Use{' '}
            <strong>Report a problem</strong>{' '}
            on that seller's parcel. The seller and NeereMarket support are notified straight away.{' '}
            <Link to="/disputes">Resolution center</Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
