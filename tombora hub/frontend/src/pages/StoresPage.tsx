import { Helmet } from 'react-helmet-async';
import { useStores } from '@/api/hooks';
import { Alert, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { SellerCard } from '@/components/product';
import { getErrorMessage } from '@/api/client';
import styles from './StoresPage.module.css';

export function StoresPage() {
  const { data, isLoading, isError, error } = useStores(1);

  return (
    <div className="container">
      <Helmet>
        <title>Stores | NeereMarket</title>
      </Helmet>
      <h1>Seller stores</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        Discover boutiques, market stalls, and shops across Rwanda.
      </p>
      {isLoading ? <ProductGridSkeleton count={4} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {!isLoading && data?.items.length === 0 ? (
        <EmptyState title="No stores yet" description="Sellers can register for free." />
      ) : null}
      <div className={styles.grid}>
        {data?.items.map((store) => (
          <SellerCard key={store.id} store={store} />
        ))}
      </div>
    </div>
  );
}
