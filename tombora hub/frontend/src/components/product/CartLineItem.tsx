import { Link } from 'react-router-dom';
import { formatRwf } from '@/utils/money';
import { QuantitySelector } from './QuantitySelector';
import { variantLabel } from '@/utils/variant';
import styles from './CartLineItem.module.css';

export type CartLine = {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantName?: string | null;
  attributes?: Record<string, string>;
  available?: number;
  image: string | null;
  storeName: string;
  storeSlug: string;
};

type Props = {
  item: CartLine;
  onUpdateQty: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onMoveToWishlist?: (item: CartLine) => void;
  busy?: boolean;
};

export function CartLineItem({ item, onUpdateQty, onRemove, onMoveToWishlist, busy }: Props) {
  const available = item.available ?? 0;
  const option = variantLabel(item.variantName, item.attributes);
  const out = available < 1;
  const isLowStock = available > 0 && available <= 3;

  return (
    <article className={`${styles.row} ${out ? styles.rowOos : ''}`}>
      {/* Product Image Thumbnail */}
      <Link to={`/products/${item.productSlug}`} className={styles.media} title={item.productName}>
        <img
          src={item.image || 'https://placehold.co/120x120/f1f5f9/64748b?text=Item'}
          alt={item.productName}
          loading="lazy"
        />
        {out ? <span className={styles.mediaOosTag}>Out of stock</span> : null}
      </Link>

      {/* Main Details */}
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <Link to={`/products/${item.productSlug}`} className={styles.titleLink}>
            <h3 className={styles.title}>{item.productName}</h3>
          </Link>
        </div>

        {/* Variant / Attributes Pill */}
        {option ? <span className={styles.variantBadge}>{option}</span> : null}

        {/* Stock & Fulfillment Status */}
        <div className={styles.statusRow}>
          {out ? (
            <span className={`${styles.stockBadge} ${styles.stockBadgeOos}`}>
              <span className={styles.dot} /> Out of stock
            </span>
          ) : isLowStock ? (
            <span className={`${styles.stockBadge} ${styles.stockBadgeLow}`}>
              <span className={styles.dot} /> Only {available} left in stock
            </span>
          ) : (
            <span className={`${styles.stockBadge} ${styles.stockBadgeIn}`}>
              <span className={styles.dot} /> In stock ({available} available)
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className={styles.actions}>
          {!out ? (
            <div className={styles.qtyBox}>
              <QuantitySelector
                value={item.quantity}
                max={available}
                onChange={(q) => onUpdateQty(item.id, q)}
              />
            </div>
          ) : null}

          <div className={styles.actionBtns}>
            {onMoveToWishlist ? (
              <button
                type="button"
                className={styles.actionBtn}
                disabled={busy}
                onClick={() => onMoveToWishlist(item)}
                title="Save this item to your wishlist for later"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <span>Save for later</span>
              </button>
            ) : null}

            <button
              type="button"
              className={`${styles.actionBtn} ${styles.removeBtn}`}
              disabled={busy}
              onClick={() => onRemove(item.id)}
              title="Remove item from cart"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Price & Line Total */}
      <div className={styles.pricing}>
        <p className={styles.lineTotal}>{formatRwf(item.lineTotal)}</p>
        {item.quantity > 1 ? (
          <p className={styles.unitPrice}>{formatRwf(item.unitPrice)} each</p>
        ) : null}
      </div>
    </article>
  );
}
