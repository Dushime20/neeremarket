import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSearch } from '@/api/hooks';
import { Alert, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import { getErrorMessage } from '@/api/client';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const query = useMemo(() => ({ q, page: 1, limit: 24 }), [q]);
  const { data, isLoading, isError, error } = useSearch(query);

  return (
    <div className="container">
      <Helmet>
        <title>{q ? `Search “${q}”` : 'Search'} | NeereMarket</title>
      </Helmet>
      <h1>Search results</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        {q ? `Showing matches for “${q}”` : 'Enter a search from the header.'}
      </p>
      {isLoading ? <ProductGridSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {!isLoading && data?.items.length === 0 ? (
        <EmptyState title="No products found" description="Try another keyword or browse categories." />
      ) : null}
      {data?.items.length ? <ProductGrid products={data.items} /> : null}
    </div>
  );
}
