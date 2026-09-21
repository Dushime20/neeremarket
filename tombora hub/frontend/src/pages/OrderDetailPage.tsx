import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useMockPay, useOrder } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './OrderDetailPage.module.css';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: user } = useMe();
  const { data: order, isLoading, isError, error } = useOrder(id);
  const mockPay = useMockPay();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container">
        <EmptyState title="Log in required" actionLabel="Log in" onAction={() => navigate(loginHref(`/orders/${id}`))} />
      </div>
    );
  }

  const status = String(order?.status || '');
  const sellerOrders = (order?.sellerOrders || []) as Array<{
    sellerOrderNumber: string;
    sellerName: string;
    status: string;
    subtotal: string;
    items: Array<{ productName: string; quantity: number; lineTotal: string }>;
  }>;

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>
          {order ? `Order ${String(order.orderNumber)}` : 'Order'} | NeereMarket
        </title>
      </Helmet>
      <p>
        <Link to="/orders">â† All orders</Link>
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

          {status === 'PENDING_PAYMENT' ? (
            <div className={styles.payBox}>
              <Alert tone="info">Awaiting payment confirmation.</Alert>
              <Button
                type="button"
                disabled={mockPay.isPending}
                onClick={() => mockPay.mutate(id)}
              >
                {mockPay.isPending ? 'Confirming…' : 'Simulate MoMo payment success'}
              </Button>
            </div>
          ) : null}

          {sellerOrders.map((so) => (
            <section key={so.sellerOrderNumber} className={styles.sellerOrder}>
              <h2>
                {so.sellerOrderNumber} Â· {so.sellerName}
              </h2>
              <Badge tone="muted">{so.status}</Badge>
              <ul>
                {so.items.map((item, idx) => (
                  <li key={`${so.sellerOrderNumber}-${idx}`}>
                    <span>
                      {item.productName} Ã— {item.quantity}
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
