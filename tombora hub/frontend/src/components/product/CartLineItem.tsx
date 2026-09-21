import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
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
  busy?: boolean;
};

export function CartLineItem({ item, onUpdateQty, onRemove, busy }: Props) {
  const available = item.available ?? 0;
  const option = variantLabel(item.variantName, item.attributes);
  const out = available < 1;

  return (
    <article className={styles.row}>
      <Link to={`/products/${item.productSlug}`} className={styles.media}>
        <img
          src={item.image || 'https://placehold.co/120x120/d5e0d8/14201a?text=Item'}
          alt={item.productName}
        />
      </Link>
      <div className={styles.body}>
        <Link to={`/products/${item.productSlug}`}>
          <h3>{item.productName}</h3>
        </Link>
        <p className={styles.store}>
          {option} · Sold by <Link to={`/stores/${item.storeSlug}`}>{item.storeName}</Link>
        </p>
        {out ? (
          <p className={styles.oos}>This option is out of stock and cannot be ordered.</p>
        ) : (
          <p className={styles.store}>{available} available</p>
        )}
        <p className={styles.price}>{formatRwf(item.unitPrice)}</p>
        <div className={styles.actions}>
          {out ? null : (
            <QuantitySelector
              value={item.quantity}
              max={available}
              onChange={(q) => onUpdateQty(item.id, q)}
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onRemove(item.id)}
          >
            Remove
          </Button>
        </div>
      </div>
      <p className={styles.lineTotal}>{formatRwf(item.lineTotal)}</p>
    </article>
  );
}
