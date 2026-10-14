import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { SellerOrder } from '@/api/hooks';
import { Badge, Button } from '@/components/ui';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './SellerOrderDetailModal.module.css';

const NEXT: Record<string, 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | null> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'READY_FOR_SHIPMENT',
  READY_FOR_SHIPMENT: 'SHIPPED',
};

const AWAITING_RECEIPT = ['SHIPPED', 'OUT_FOR_DELIVERY'];

export interface SellerOrderDetailModalProps {
  order: SellerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, nextStatus: 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED') => void;
  isUpdatingStatus?: boolean;
}

export function SellerOrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdatingStatus = false,
}: SellerOrderDetailModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

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
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHead}>
          <div className={styles.modalTitleWrap}>
            <div className={styles.kickerRow}>
              <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
              {formattedDate ? <span className={styles.parentOrderHint}>Placed {formattedDate}</span> : null}
            </div>
            <h2 id="order-detail-title" className={styles.orderNumber}>
              Order {order.sellerOrderNumber}
            </h2>
            <p className={styles.parentOrderHint}>
              Master Order: <strong>{order.parentOrderNumber}</strong>
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close details" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.modalBody}>
          {/* Customer & Shipping Address Cards */}
          <div className={styles.gridCards}>
            {/* Customer Details */}
            <div className={styles.infoCard}>
              <div className={styles.cardHead}>
                <div className={`${styles.cardIcon} ${styles.cardIconCustomer}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className={styles.cardHeadTitle}>Customer Information</h3>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.customerHeader}>
                  <div className={styles.avatar}>
                    {customerName.charAt(0).toUpperCase()}
                  </div>
                  <h4 className={styles.customerName}>{customerName}</h4>
                </div>

                {customerPhone ? (
                  <div className={styles.contactRow} style={{ flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>Phone:</span>
                      <a href={`tel:${customerPhone}`} className={styles.contactLink} title="Call customer">
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
                  <div className={styles.contactRow}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>Email:</span>
                    <a href={`mailto:${customerEmail}`} className={styles.contactLink} title="Email customer">
                      {customerEmail}
                    </a>
                  </div>
                ) : null}

                {order.notes ? (
                  <div className={styles.instructionsBox}>
                    <strong>Customer Order Note:</strong>
                    {order.notes}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Shipping & Delivery Address */}
            <div className={styles.infoCard}>
              <div className={styles.cardHead}>
                <div className={`${styles.cardIcon} ${styles.cardIconAddress}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className={styles.cardHeadTitle}>Shipping Address</h3>
              </div>
              <div className={styles.cardBody}>
                {address ? (
                  <>
                    <div className={styles.addressMain}>
                      <strong>Deliver to: {address.fullName}</strong>
                      {address.phone ? (
                        <div className={styles.contactRow} style={{ marginTop: '0.2rem' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <a href={`tel:${address.phone}`} className={styles.contactLink}>
                            {address.phone}
                          </a>
                        </div>
                      ) : null}
                    </div>

                    <div className={styles.addressMeta}>
                      <span>{fullAddressLines.join(', ')}</span>
                      {address.landmark ? <span>Landmark: <strong>{address.landmark}</strong></span> : null}
                    </div>

                    {address.instructions ? (
                      <div className={styles.instructionsBox}>
                        <strong>Delivery Instructions:</strong>
                        {address.instructions}
                      </div>
                    ) : null}

                    {mapsUrl ? (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                          <line x1="9" x2="9" y1="3" y2="18" />
                          <line x1="15" x2="15" y1="6" y2="21" />
                        </svg>
                        View on Map
                      </a>
                    ) : null}
                  </>
                ) : (
                  <p className={styles.addressMeta}>No delivery address attached to this order.</p>
                )}
              </div>
            </div>
          </div>

          {/* Items to Fulfill */}
          <div className={styles.itemsCard}>
            <div className={styles.itemsHead}>
              <h3 className={styles.cardHeadTitle}>
                Items to Pack & Fulfill ({order.items.reduce((acc, i) => acc + i.quantity, 0)} units)
              </h3>
            </div>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={item.id || `${order.id}-item-${idx}`}>
                    <td>
                      <div className={styles.itemTitle}>{item.productName}</div>
                      {item.variantName ? <div className={styles.itemVariant}>{item.variantName}</div> : null}
                      {item.sku ? <div className={styles.itemSku}>SKU: {item.sku}</div> : null}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>×{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatRwf(item.unitPrice || '0')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRwf(item.lineTotal || '0')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className={styles.summaryRow}>
              <div className={styles.summaryList}>
                <div className={styles.summaryItem}>
                  <span>Subtotal:</span>
                  <strong>{formatRwf(order.subtotal)}</strong>
                </div>
                {order.deliveryFee && Number(order.deliveryFee) > 0 ? (
                  <div className={styles.summaryItem}>
                    <span>Delivery Fee:</span>
                    <strong>{formatRwf(order.deliveryFee)}</strong>
                  </div>
                ) : null}
                {order.commissionTotal && Number(order.commissionTotal) > 0 ? (
                  <div className={styles.summaryItem}>
                    <span>Platform Commission:</span>
                    <span>-{formatRwf(order.commissionTotal)}</span>
                  </div>
                ) : null}
                <div className={styles.summaryTotal}>
                  <span>Estimated Earnings:</span>
                  <span className={styles.earningsTag}>
                    {order.sellerEarnings ? formatRwf(order.sellerEarnings) : formatRwf(order.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFoot}>
          <div className={styles.statusMessage}>
            {AWAITING_RECEIPT.includes(order.status) ? (
              <span>Shipped • Awaiting customer confirmation to release funds.</span>
            ) : null}
          </div>

          <div className={styles.footActions}>
            <Link to={`/seller/orders/${order.id}`}>
              <Button type="button" variant="ghost" onClick={onClose} title="Open in dedicated page">
                Full Page
              </Button>
            </Link>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            {next && onUpdateStatus ? (
              <Button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => onUpdateStatus(order.id, next)}
              >
                {isUpdatingStatus ? 'Updating...' : `Mark ${prettyStatus(next).toLowerCase()}`}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
