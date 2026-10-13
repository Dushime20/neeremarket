import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAdminOrder, useConfirmDelivery, useMe } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, TableSkeleton, useConfirm, useToast } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { isAdminRole } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

const AWAITING_RECEIPT = ['SHIPPED', 'OUT_FOR_DELIVERY'];

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}

export function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { data: user } = useMe();
  const { data: order, isLoading, isError, error } = useAdminOrder(user ? id : '');
  const confirmDelivery = useConfirmDelivery('admin');
  const [deliveryMsg, setDeliveryMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  async function onConfirmDelivery(sellerOrderId: string, label: string) {
    const ok = await confirm({
      title: 'Confirm delivery on customer behalf',
      message: `Confirm ${label} was delivered on the customer's behalf? This releases the seller's held funds.`,
      confirmText: 'Confirm delivery',
      tone: 'info',
    });
    if (!ok) return;

    setDeliveryMsg(null);
    try {
      await confirmDelivery.mutateAsync({ orderId: id, sellerOrderId });
      const msg = `${label} marked delivered — seller funds released.`;
      setDeliveryMsg({ tone: 'success', text: msg });
      toast.success(msg);
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not confirm delivery');
      setDeliveryMsg({ tone: 'error', text: msg });
      toast.error(msg);
    }
  }

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Admin login required"
          actionLabel="Log in"
          onAction={() => navigate(`/login?next=/admin/orders/${id}`)}
        />
      </div>
    );
  }

  if (!isAdminRole(user.roles)) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className={styles.stack}>
        <TableSkeleton />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Order not found"
          description={getErrorMessage(error, 'This order is missing or you lack access.')}
          actionLabel="Back to orders"
          onAction={() => navigate('/admin/orders')}
        />
      </div>
    );
  }

  const address = order.address;

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Order {order.orderNumber} | NeereMarket admin</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>
            <Link to="/admin/orders">← All orders</Link>
          </p>
          <h1>{order.orderNumber}</h1>
          <div className={styles.pageMeta}>
            <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
            <span className={styles.muted}>Placed {formatDate(order.createdAt)}</span>
            {order.paidAt ? <span className={styles.muted}>Paid {formatDate(order.paidAt)}</span> : null}
          </div>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/orders">
            <Button type="button" size="sm" variant="ghost">
              Back to orders
            </Button>
          </Link>
        </div>
      </header>

      <div className={styles.split}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Customer</h2>
          </div>
          <div className={styles.panelBody}>
            <p>
              <strong>{order.customer.fullName}</strong>
            </p>
            {order.customer.email ? <p className={styles.muted}>{order.customer.email}</p> : null}
            {order.customer.phone ? <p className={styles.muted}>{order.customer.phone}</p> : null}
            {address ? (
              <>
                <p>
                  <strong>Deliver to:</strong> {address.fullName} · {address.phone}
                </p>
                <p className={styles.muted}>
                  {[
                    address.street,
                    address.village,
                    address.cell,
                    address.sector,
                    address.district,
                    address.province,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {address.landmark ? <p className={styles.muted}>Landmark: {address.landmark}</p> : null}
                {address.instructions ? (
                  <p className={styles.muted}>Instructions: {address.instructions}</p>
                ) : null}
              </>
            ) : (
              <p className={styles.muted}>No delivery address.</p>
            )}
            {order.notes ? <p>Notes: {order.notes}</p> : null}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Totals</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                <tr>
                  <th>Subtotal</th>
                  <td className={styles.num}>{formatRwf(order.subtotal)}</td>
                </tr>
                <tr>
                  <th>Delivery</th>
                  <td className={styles.num}>{formatRwf(order.deliveryFee)}</td>
                </tr>
                <tr>
                  <th>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</th>
                  <td className={styles.num}>-{formatRwf(order.discountTotal)}</td>
                </tr>
                <tr>
                  <th>Platform charges</th>
                  <td className={styles.num}>{formatRwf(order.platformCharges)}</td>
                </tr>
                <tr>
                  <th>Total</th>
                  <td className={styles.num}>
                    <strong>{formatRwf(order.total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {deliveryMsg ? <Alert tone={deliveryMsg.tone}>{deliveryMsg.text}</Alert> : null}

      {order.sellerOrders.map((so) => (
        <section key={so.id} className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>
              {so.sellerOrderNumber} · {so.sellerName}
            </h2>
            <div className={styles.actions}>
              <Badge tone={statusTone(so.status)}>{prettyStatus(so.status)}</Badge>
              {AWAITING_RECEIPT.includes(so.status) ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={confirmDelivery.isPending}
                  onClick={() => void onConfirmDelivery(so.id, so.sellerOrderNumber)}
                >
                  Confirm delivery
                </Button>
              ) : null}
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {so.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.productName}
                      {item.variantName ? <span className={styles.muted}> · {item.variantName}</span> : null}
                    </td>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td className={styles.num}>{formatRwf(item.unitPrice)}</td>
                    <td className={styles.num}>{formatRwf(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.panelBody}>
            <p className={styles.muted}>
              Subtotal {formatRwf(so.subtotal)} · Delivery {formatRwf(so.deliveryFee)}
            </p>
          </div>
        </section>
      ))}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Payments</h2>
        </div>
        {order.payments.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.provider}</td>
                    <td>{prettyStatus(p.method)}</td>
                    <td>{p.providerRef || '—'}</td>
                    <td>
                      <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                    </td>
                    <td className={styles.num}>{formatRwf(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.panelBody}>
            <p className={styles.muted}>No payments recorded.</p>
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Status history</h2>
        </div>
        {order.statusHistory.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {order.statusHistory.map((h) => (
                  <tr key={h.id}>
                    <td>{formatDate(h.createdAt)}</td>
                    <td>{h.fromStatus ? prettyStatus(h.fromStatus) : '—'}</td>
                    <td>{prettyStatus(h.toStatus)}</td>
                    <td>{h.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.panelBody}>
            <p className={styles.muted}>No status changes yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
