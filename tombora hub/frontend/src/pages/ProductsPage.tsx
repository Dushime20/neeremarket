import { Helmet } from 'react-helmet-async';
import { useProducts } from '@/api/hooks';
import { Alert, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import { getErrorMessage } from '@/api/client';

export function ProductsPage() {
  const { data, isLoading, isError, error } = useProducts({ page: 1, limit: 24 });

  return (
    <div className="container">
      <Helmet>
        <title>Products | NeereMarket</title>
      </Helmet>
      <h1>All products</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>Browse the live marketplace catalog.</p>
      {isLoading ? <ProductGridSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {!isLoading && data?.items.length === 0 ? (
        <EmptyState title="No products published yet" />
      ) : null}
      {data?.items.length ? <ProductGrid products={data.items} /> : null}
    </div>
  );
}
