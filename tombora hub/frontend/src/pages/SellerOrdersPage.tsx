import { Helmet } from 'react-helmet-async';
import { useSellerOrders, useUpdateSellerOrderStatus } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

const NEXT: Record<string, 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | 'DELIVERED' | null> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'READY_FOR_SHIPMENT',
  READY_FOR_SHIPMENT: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

export function SellerOrdersPage() {
  const { data, isLoading, isError, error } = useSellerOrders();
  const updateStatus = useUpdateSellerOrderStatus();

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Seller orders | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Fulfillment</p>
          <h1>Orders</h1>
          <p>Advance each seller order as you pack and hand off to delivery.</p>
        </div>
      </header>

      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {!isLoading && data?.items.length === 0 ? (
        <section className={styles.panel}>
          <div className={styles.panelBody}>
            <EmptyState compact title="No seller orders yet" description="They appear after customers pay." />
          </div>
        </section>
      ) : null}

      {data?.items.length ? (
        <section className={styles.panel}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => {
                  const next = NEXT[order.status];
                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.sellerOrderNumber}</strong>
                        <small>Parent {order.parentOrderNumber}</small>
                      </td>
                      <td>
                        <ul className={styles.orderItems}>
                          {order.items.map((item, i) => (
                            <li key={`${order.id}-${i}`}>
                              {item.productName} Ã— {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
                      </td>
                      <td className={styles.num}>{formatRwf(order.subtotal)}</td>
                      <td>
                        {next ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: order.id, status: next })}
                          >
                            Mark {prettyStatus(next).toLowerCase()}
                          </Button>
                        ) : (
                          <span className={styles.muted}>No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
