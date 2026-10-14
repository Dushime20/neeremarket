import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSellerOrders, useUpdateSellerOrderStatus, type SellerOrder } from '@/api/hooks';
import {
  ActionIconButton,
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
import { SellerOrderDetailModal } from '@/components/orders/SellerOrderDetailModal';
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
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const pageSize = 10;

  const orders = data?.items || [];
  const toPackCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const readyCount = orders.filter((o) => o.status === 'READY_FOR_SHIPMENT').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY').length;

  const filteredOrders = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) {
      if (statusFilter === 'SHIPPED') {
        if (!['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)) return false;
      } else {
        return false;
      }
    }
    if (!search) return true;
    const q = search.toLowerCase();
    const customerName = order.customer?.fullName || order.address?.fullName || '';
    const customerPhone = order.customer?.phone || order.address?.phone || '';
    const destination = [order.address?.district, order.address?.sector, order.address?.province].filter(Boolean).join(' ');

    return (
      order.sellerOrderNumber.toLowerCase().includes(q) ||
      order.parentOrderNumber.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      customerPhone.toLowerCase().includes(q) ||
      destination.toLowerCase().includes(q) ||
      order.items.some((item) => item.productName.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  function handleStatusUpdate(orderId: string, nextStatus: 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED') {
    updateStatus.mutate(
      { id: orderId, status: nextStatus },
      {
        onSuccess: () => {
          setSelectedOrder((prev) =>
            prev && prev.id === orderId ? { ...prev, status: nextStatus } : prev,
          );
        },
      },
    );
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Seller orders | NeereMarket</title>
      </Helmet>

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
                <strong>{orders.length}</strong> total · <strong>{toPackCount}</strong> to pack · <strong>{processingCount}</strong> processing
              </span>
            }
          />
          <TableToolbar
            searchValue={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            searchPlaceholder="Search order #, customer, address, items..."
            filterChips={[
              { id: '', label: 'All Orders', count: orders.length },
              ...(toPackCount ? [{ id: 'CONFIRMED', label: 'To Pack', count: toPackCount }] : []),
              ...(processingCount ? [{ id: 'PROCESSING', label: 'Processing', count: processingCount }] : []),
              ...(readyCount ? [{ id: 'READY_FOR_SHIPMENT', label: 'Ready', count: readyCount }] : []),
              ...(shippedCount ? [{ id: 'SHIPPED', label: 'Shipped', count: shippedCount }] : []),
            ]}
            activeFilter={statusFilter}
            onFilterChange={(id) => {
              setStatusFilter(id);
              setPage(1);
            }}
            columnsAction={{
              label: 'Columns',
            }}
          />

          {/* Desktop Table View */}
          <div className={`${styles.tableWrap} ${styles.desktopOnlyTable}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh>Order</SortTh>
                  <SortTh>Customer & Delivery</SortTh>
                  <SortTh>Items</SortTh>
                  <SortTh>Status</SortTh>
                  <SortTh align="right">Total</SortTh>
                  <SortTh sortable={false}>Actions</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => {
                  const next = NEXT[order.status];
                  const customerName = order.customer?.fullName || order.address?.fullName || 'Customer';
                  const deliveryLoc = order.address
                    ? [order.address.district, order.address.province].filter(Boolean).join(', ')
                    : 'Standard delivery';

                  return (
                    <tr key={order.id}>
                      <td>
                        <button
                          type="button"
                          className={styles.orderBtn}
                          onClick={() => setSelectedOrder(order)}
                          title="Click to view full order details"
                        >
                          <strong>{order.sellerOrderNumber}</strong>
                        </button>
                        <small>Parent {order.parentOrderNumber}</small>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.orderBtn}
                          onClick={() => setSelectedOrder(order)}
                          title="View customer & address"
                        >
                          <strong>{customerName}</strong>
                        </button>
                        <small className={styles.muted}>{deliveryLoc}</small>
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
                        <div className={styles.actionCell}>
                          <ActionIconButton
                            icon="view"
                            tone="info"
                            size="sm"
                            label="View customer & shipping details"
                            title="View customer information & shipping address"
                            onClick={() => setSelectedOrder(order)}
                          />
                          {next ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={updateStatus.isPending}
                              onClick={() => handleStatusUpdate(order.id, next)}
                            >
                              Mark {prettyStatus(next).toLowerCase()}
                            </Button>
                          ) : AWAITING_RECEIPT.includes(order.status) ? (
                            <span className={styles.muted} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              Awaiting delivery
                            </span>
                          ) : (
                            <span className={styles.muted} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Mobile-First for Phone Sellers) */}
          <div className={styles.mobileOnlyCards}>
            {paginatedOrders.map((order) => {
              const next = NEXT[order.status];
              const customerName = order.customer?.fullName || order.address?.fullName || 'Customer';
              const phone = order.customer?.phone || order.address?.phone;
              const cleanPhone = phone ? phone.replace(/\D/g, '').replace(/^0/, '250') : null;
              const deliveryLoc = order.address
                ? [order.address.kgAddress || order.address.street, order.address.sector, order.address.district].filter(Boolean).join(', ')
                : 'Standard delivery';

              return (
                <article key={order.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHead}>
                    <div>
                      <button
                        type="button"
                        className={styles.orderBtn}
                        onClick={() => setSelectedOrder(order)}
                        title="Click to view full order details"
                      >
                        <strong className={styles.mono} style={{ fontSize: '1rem', color: 'var(--color-brand)' }}>
                          {order.sellerOrderNumber}
                        </strong>
                      </button>
                      <p className={styles.mobileCardSubtitle}>
                        Master: {order.parentOrderNumber}
                      </p>
                    </div>
                    <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
                  </div>

                  <div className={styles.mobileCardBody}>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Customer</span>
                      <strong className={styles.mobileCardValue}>{customerName}</strong>
                    </div>

                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Destination</span>
                      <span className={styles.mobileCardValue} style={{ maxWidth: '65%' }}>{deliveryLoc}</span>
                    </div>

                    {phone ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <a
                          href={`tel:${phone}`}
                          className={`${styles.mobileQuickBtn} ${styles.mobileCallBtn}`}
                          title={`Call ${phone}`}
                        >
                          📞 Call ({phone})
                        </a>
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.mobileQuickBtn} ${styles.mobileWaBtn}`}
                            title="Chat on WhatsApp"
                          >
                            💬 WhatsApp
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #eef2f6', marginTop: '0.25rem' }}>
                      <span className={styles.mobileCardLabel} style={{ display: 'block', marginBottom: '0.25rem' }}>
                        Items ({order.items.reduce((s, i) => s + i.quantity, 0)} total)
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8125rem', color: '#1e293b' }}>
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            <strong>{item.quantity}×</strong> {item.productName}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.mobileCardRow} style={{ marginTop: '0.25rem' }}>
                      <span className={styles.mobileCardLabel}>Subtotal</span>
                      <span className={styles.mobileCardPrice}>{formatRwf(order.subtotal)}</span>
                    </div>
                  </div>

                  <div className={styles.mobileCardFoot}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View details
                    </Button>
                    {next ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={updateStatus.isPending}
                        onClick={() => handleStatusUpdate(order.id, next)}
                      >
                        {updateStatus.isPending ? 'Updating...' : `Mark ${prettyStatus(next).toLowerCase()}`}
                      </Button>
                    ) : (
                      <span className={styles.muted} style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                        {AWAITING_RECEIPT.includes(order.status) ? 'Awaiting delivery' : 'Completed'}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
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

      {/* Order Detail Modal */}
      <SellerOrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleStatusUpdate}
        isUpdatingStatus={updateStatus.isPending}
      />
    </div>
  );
}
