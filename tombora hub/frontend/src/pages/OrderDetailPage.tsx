import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useMockPay, useOrder, useVerifyPayment } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './OrderDetailPage.module.css';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: user } = useMe();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const mockPay = useMockPay();
  const verifyPayment = useVerifyPayment();
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
    sellerOrderNumber: string;
    sellerName: string;
    status: string;
    subtotal: string;
    items: Array<{ productName: string; quantity: number; lineTotal: string }>;
  }>;

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
            <p className={styles.total}>{formatRwf(String(order.total))}</p>
          </header>

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
                {import.meta.env.DEV && openPayment.provider === 'mock' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={mockPay.isPending}
                    onClick={() => mockPay.mutate(id)}
                  >
                    {mockPay.isPending ? 'Confirming…' : 'Simulate payment success'}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {sellerOrders.map((so) => (
            <section key={so.sellerOrderNumber} className={styles.sellerOrder}>
              <h2>
                {so.sellerOrderNumber} · {so.sellerName}
              </h2>
              <Badge tone="muted">{so.status}</Badge>
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
              <p>Seller subtotal: {formatRwf(so.subtotal)}</p>
            </section>
          ))}
        </>
      ) : null}
    </div>
  );
}
