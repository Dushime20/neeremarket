import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSellerOrders, useUpdateSellerOrderStatus } from '@/api/hooks';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  SortTh,
  TableBanner,
  TableCard,
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

const NEXT: Record<string, 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | null> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'READY_FOR_SHIPMENT',
  READY_FOR_SHIPMENT: 'SHIPPED',
};

const AWAITING_RECEIPT = ['SHIPPED', 'OUT_FOR_DELIVERY'];

export function SellerOrdersPage() {
  const { data, isLoading, isError, error } = useSellerOrders();
  const updateStatus = useUpdateSellerOrderStatus();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const orders = data?.items || [];
  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      order.sellerOrderNumber.toLowerCase().includes(q) ||
      order.parentOrderNumber.toLowerCase().includes(q) ||
      order.items.some((item) => item.productName.toLowerCase().includes(q))
    );
  });
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Seller orders | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Fulfillment</p>
          <h1>Orders</h1>
          <p>
            Advance each order as you pack and ship it. Your earnings stay on hold until the customer
            confirms delivery, then move to your available balance.
          </p>
        </div>
      </header>

      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {!isLoading && orders.length === 0 ? (
        <section className={styles.panel}>
          <div className={styles.panelBody}>
            <EmptyState compact title="No seller orders yet" description="They appear after customers pay." />
          </div>
        </section>
      ) : null}

      {orders.length ? (
        <TableCard>
          <TableBanner
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            }
            title="Fulfillment Orders Queue"
            subtitle={
              <span>
                <strong>{orders.length}</strong> customer orders to fulfill
              </span>
            }
          />
          <TableToolbar
            searchValue={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            searchPlaceholder="Search order #, items..."
            columnsAction={{
              label: 'Columns',
            }}
          />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh>Order</SortTh>
                  <SortTh>Items</SortTh>
                  <SortTh>Status</SortTh>
                  <SortTh align="right">Total</SortTh>
                  <SortTh sortable={false}>Action</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => {
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
                              {item.productName} × {item.quantity}
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
                        ) : AWAITING_RECEIPT.includes(order.status) ? (
                          <span className={styles.muted}>Waiting for customer to confirm delivery</span>
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
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </TableCard>
      ) : null}
    </div>
  );
}
