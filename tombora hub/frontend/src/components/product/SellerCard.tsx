import { Link } from 'react-router-dom';
import { Badge, Rating } from '@/components/ui';
import styles from './SellerCard.module.css';

export type StoreListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seller: {
    businessName: string;
    verificationStatus: string;
    district: string | null;
    province: string | null;
    ratingAvg: string;
    ratingCount: number;
    logoUrl: string | null;
    marketLocation: string | null;
  };
  _count?: { products: number };
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  }>;
};

export function SellerCard({ store }: { store: StoreListItem }) {
  const verified = store.seller.verificationStatus === 'VERIFIED';
  return (
    <article className={styles.card}>
      <Link to={`/stores/${store.slug}`} className={styles.link}>
        <div className={styles.logo}>
          {store.seller.logoUrl ? (
            <img src={store.seller.logoUrl} alt="" />
          ) : (
            <span>{store.name.slice(0, 1)}</span>
          )}
        </div>
        <div>
          <h3>{store.name}</h3>
          <div className={styles.meta}>
            {verified ? <Badge>Verified</Badge> : <Badge tone="muted">Pending</Badge>}
            <Rating value={store.seller.ratingAvg} count={store.seller.ratingCount} />
          </div>
          <p className={styles.loc}>
            {[store.seller.marketLocation, store.seller.district, store.seller.province]
              .filter(Boolean)
              .join(' · ') || 'Rwanda'}
          </p>
          {store._count ? (
            <p className={styles.count}>{store._count.products} products</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
