import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useOrders } from '@/api/hooks';
import { Alert, Badge, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './OrdersPage.module.css';

export function OrdersPage() {
  const { data: user } = useMe();
  const { data, isLoading, isError, error } = useOrders();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in to see orders"
          actionLabel="Log in"
          onAction={() => navigate(loginHref('/orders'))}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <Helmet>
        <title>My orders | NeereMarket</title>
      </Helmet>
      <h1>My orders</h1>
      {isLoading ? <ProductGridSkeleton count={3} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {!isLoading && data?.items.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you checkout, multi-seller orders appear here as one parent order."
          actionLabel="Start shopping"
          onAction={() => navigate('/products')}
        />
      ) : null}
      <ul className={styles.list}>
        {data?.items.map((order) => (
          <li key={order.id}>
            <Link to={`/orders/${order.id}`} className={styles.card}>
              <div>
                <strong>{order.orderNumber}</strong>
                <p>
                  {order.sellerOrders?.map((s) => s.sellerOrderNumber).join(', ')}
                </p>
              </div>
              <Badge tone="muted">{order.status}</Badge>
              <span>{formatRwf(order.total)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
