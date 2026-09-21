import { Link } from 'react-router-dom';
import type { ProductListItem } from '@/api/hooks';
import { Badge, Rating } from '@/components/ui';
import { PriceDisplay } from './PriceDisplay';
import { discountPercent } from '@/utils/money';
import styles from './ProductCard.module.css';

type Props = { product: ProductListItem };

export function ProductCard({ product }: Props) {
  const pct = discountPercent(product.price, product.discountPrice);
  const verified = product.store.seller.verificationStatus === 'VERIFIED';

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.slug}`} className={styles.media}>
        {pct ? <span className={styles.badge}>{pct}% OFF</span> : null}
        <img
          src={product.images[0]?.url || 'https://placehold.co/600x600/d5e0d8/14201a?text=Product'}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      <div className={styles.body}>
        <Link to={`/products/${product.slug}`}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>
        <Rating value={product.ratingAvg} count={product.ratingCount} />
        <PriceDisplay price={product.price} discountPrice={product.discountPrice} />
        <p className={styles.seller}>
          {verified ? <Badge>Verified</Badge> : null}
          <Link to={`/stores/${product.store.slug}`}>{product.store.name}</Link>
          {product.store.seller.district ? (
            <span className={styles.loc}>{product.store.seller.district}</span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
