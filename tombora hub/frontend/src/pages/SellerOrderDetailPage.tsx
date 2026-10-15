import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSellerOrder, useUpdateSellerOrderStatus } from '@/api/hooks';
import { Badge, Button, EmptyState, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';
import modalStyles from '@/components/orders/SellerOrderDetailModal.module.css';

const NEXT: Record<string, 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | null> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'READY_FOR_SHIPMENT',
  READY_FOR_SHIPMENT: 'SHIPPED',
};

const AWAITING_RECEIPT = ['SHIPPED', 'OUT_FOR_DELIVERY'];

export function SellerOrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, error } = useSellerOrder(id);
  const updateStatus = useUpdateSellerOrderStatus();

  if (isLoading) {
    return (
      <div className={styles.stack}>
        <TableSkeleton />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelBody}>
            <EmptyState
              title="Order not found"
              description={getErrorMessage(error, 'This order could not be found or you lack permission to view it.')}
              actionLabel="Back to orders"
              onAction={() => navigate('/seller/orders')}
            />
          </div>
        </section>
      </div>
    );
  }

  const next = NEXT[order.status];
  const customerName = order.customer?.fullName || order.address?.fullName || 'Customer';
  const customerPhone = order.customer?.phone || order.address?.phone;
  const customerEmail = order.customer?.email;
  const address = order.address;

  const fullAddressLines = address
    ? [
        address.kgAddress || address.street,
        address.building ? `Building: ${address.building}` : null,
        address.apartment ? `Apt: ${address.apartment}` : null,
        address.village,
        address.cell,
        address.sector,
        address.district,
        address.province,
      ].filter(Boolean)
    : [];

  const mapsUrl =
    address?.googleMapsUrl ||
    (address?.street
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.street}, ${address.district || 'Kigali'}, Rwanda`)}`
      : null);

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>{`Order ${order.sellerOrderNumber} | NeereMarket`}</title>
      </Helmet>

      {/* Action header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
          <span className={styles.muted} style={{ fontSize: 'var(--text-xs)' }}>Master: {order.parentOrderNumber}</span>
          {formattedDate ? <span className={styles.muted} style={{ fontSize: 'var(--text-xs)' }}>• Placed {formattedDate}</span> : null}
        </div>

        <div className={styles.actions}>
          <Link to="/seller/orders">
            <Button type="button" variant="ghost" size="sm">
              Back to orders
            </Button>
          </Link>
          {next ? (
            <Button
              type="button"
              size="sm"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: order.id, status: next })}
            >
              {updateStatus.isPending ? 'Updating...' : `Mark ${prettyStatus(next).toLowerCase()}`}
            </Button>
          ) : AWAITING_RECEIPT.includes(order.status) ? (
            <span className={styles.muted} style={{ fontSize: '0.8125rem' }}>
              Shipped • Awaiting customer confirmation
            </span>
          ) : null}
        </div>
      </div>

      {/* Customer Information & Shipping Address */}
      <div className={modalStyles.gridCards}>
        {/* Customer Details */}
        <div className={modalStyles.infoCard}>
          <div className={modalStyles.cardHead}>
            <div className={`${modalStyles.cardIcon} ${modalStyles.cardIconCustomer}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className={modalStyles.cardHeadTitle}>Customer Information</h3>
          </div>
          <div className={modalStyles.cardBody}>
            <div className={modalStyles.customerHeader}>
              <div className={modalStyles.avatar}>
                {customerName.charAt(0).toUpperCase()}
              </div>
              <h4 className={modalStyles.customerName}>{customerName}</h4>
            </div>

            {customerPhone ? (
              <div className={modalStyles.contactRow} style={{ flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Phone:</span>
                  <a href={`tel:${customerPhone}`} className={modalStyles.contactLink} title="Call customer">
                    {customerPhone}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                  <a
                    href={`tel:${customerPhone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: '#ecfdf5',
                      color: '#065f46',
                      textDecoration: 'none',
                      border: '1px solid #a7f3d0'
                    }}
                    title="Call customer directly"
                  >
                    📞 Call
                  </a>
                  {(() => {
                    const cleanWa = customerPhone.replace(/\D/g, '').replace(/^0/, '250');
                    return (
                      <a
                        href={`https://wa.me/${cleanWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#f0fdf4',
                          color: '#15803d',
                          textDecoration: 'none',
                          border: '1px solid #bbf7d0'
                        }}
                        title="Chat on WhatsApp"
                      >
                        💬 WhatsApp
                      </a>
                    );
                  })()}
                </div>
              </div>
            ) : null}

            {customerEmail ? (
              <div className={modalStyles.contactRow}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Email:</span>
                <a href={`mailto:${customerEmail}`} className={modalStyles.contactLink} title="Email customer">
                  {customerEmail}
                </a>
              </div>
            ) : null}

            {order.notes ? (
              <div className={modalStyles.instructionsBox}>
                <strong>Customer Order Note:</strong>
                {order.notes}
              </div>
            ) : null}
          </div>
        </div>

        {/* Shipping & Delivery Address */}
        <div className={modalStyles.infoCard}>
          <div className={modalStyles.cardHead}>
            <div className={`${modalStyles.cardIcon} ${modalStyles.cardIconAddress}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className={modalStyles.cardHeadTitle}>Shipping & Delivery Address</h3>
          </div>
          <div className={modalStyles.cardBody}>
            {address ? (
              <>
                <div className={modalStyles.addressMain}>
                  <strong>Deliver to: {address.fullName}</strong>
                  {address.phone ? (
                    <div className={modalStyles.contactRow} style={{ marginTop: '0.2rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <a href={`tel:${address.phone}`} className={modalStyles.contactLink}>
                        {address.phone}
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className={modalStyles.addressMeta}>
                  <span>{fullAddressLines.join(', ')}</span>
                  {address.landmark ? <span>Landmark: <strong>{address.landmark}</strong></span> : null}
                </div>

                {address.instructions ? (
                  <div className={modalStyles.instructionsBox}>
                    <strong>Courier Instructions:</strong>
                    {address.instructions}
                  </div>
                ) : null}

                {mapsUrl ? (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={modalStyles.mapsBtn}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                      <line x1="9" x2="9" y1="3" y2="18" />
                      <line x1="15" x2="15" y1="6" y2="21" />
                    </svg>
                    View on Google Maps
                  </a>
                ) : null}
              </>
            ) : (
              <p className={modalStyles.addressMeta}>No delivery address attached to this order.</p>
            )}
          </div>
        </div>
      </div>

      {/* Items to Fulfill Card */}
      <div className={modalStyles.itemsCard}>
        <div className={modalStyles.itemsHead}>
          <h3 className={modalStyles.cardHeadTitle}>
            Ordered Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)} units)
          </h3>
        </div>
        <table className={modalStyles.itemsTable}>
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Unit Price</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id || `${order.id}-item-${idx}`}>
                <td>
                  <div className={modalStyles.itemTitle}>{item.productName}</div>
                  {item.variantName ? <div className={modalStyles.itemVariant}>{item.variantName}</div> : null}
                  {item.sku ? <div className={modalStyles.itemSku}>SKU: {item.sku}</div> : null}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>×{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatRwf(item.unitPrice || '0')}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRwf(item.lineTotal || '0')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary */}
        <div className={modalStyles.summaryRow}>
          <div className={modalStyles.summaryList}>
            <div className={modalStyles.summaryItem}>
              <span>Subtotal:</span>
              <strong>{formatRwf(order.subtotal)}</strong>
            </div>
            {order.deliveryFee && Number(order.deliveryFee) > 0 ? (
              <div className={modalStyles.summaryItem}>
                <span>Delivery Fee:</span>
                <strong>{formatRwf(order.deliveryFee)}</strong>
              </div>
            ) : null}
            {order.commissionTotal && Number(order.commissionTotal) > 0 ? (
              <div className={modalStyles.summaryItem}>
                <span>Platform Commission:</span>
                <span>-{formatRwf(order.commissionTotal)}</span>
              </div>
            ) : null}
            <div className={modalStyles.summaryTotal}>
              <span>Estimated Net Earnings:</span>
              <span className={modalStyles.earningsTag}>
                {order.sellerEarnings ? formatRwf(order.sellerEarnings) : formatRwf(order.subtotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
