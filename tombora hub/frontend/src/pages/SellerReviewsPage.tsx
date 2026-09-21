import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useSellerReviews } from '@/api/hooks';
import { Alert, Badge, EmptyState, Rating, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import styles from './workspace.module.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'product', label: 'Product reviews' },
  { id: 'store', label: 'Store reviews' },
] as const;

export function SellerReviewsPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const [scope, setScope] = useState<(typeof FILTERS)[number]['id']>('all');
  const { data, isLoading, isError, error } = useSellerReviews(scope);

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller/reviews')}
        />
      </div>
    );
  }

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Reviews | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Reputation</p>
          <h1>Reviews & comments</h1>
          <p>See what buyers write about your products and your store.</p>
        </div>
      </header>

      <div className={styles.kpis}>
        <article className={styles.kpi}>
          <strong>{summary?.total ?? 0}</strong>
          <em>Total reviews</em>
        </article>
        <article className={styles.kpi}>
          <strong>{summary?.product ?? 0}</strong>
          <em>On products</em>
        </article>
        <article className={styles.kpi}>
          <strong>{summary?.store ?? 0}</strong>
          <em>On store</em>
        </article>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.filters} role="tablist" aria-label="Review type">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.chip} ${scope === f.id ? styles.chipOn : ''}`}
                onClick={() => setScope(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className={styles.panelBody}>
            <TableSkeleton />
          </div>
        ) : null}
        {isError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{getErrorMessage(error)}</Alert>
          </div>
        ) : null}
        {!isLoading && !items.length ? (
          <div className={styles.panelBody}>
            <EmptyState
              compact
              title="No reviews yet"
              description="Customer ratings and comments will appear here after orders."
            />
          </div>
        ) : null}
        {items.length ? (
          <ul className={styles.reviewList}>
            {items.map((review) => (
              <li key={review.id} className={styles.reviewItem}>
                <div className={styles.reviewHead}>
                  <span className={styles.avatar} aria-hidden>
                    {initials(review.customer.fullName)}
                  </span>
                  <div>
                    <strong>{review.customer.fullName}</strong>
                    <small>
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </small>
                  </div>
                  <div className={styles.reviewBadges}>
                    <Badge tone={review.target === 'product' ? 'brand' : 'accent'}>
                      {review.target === 'product' ? 'Product' : 'Store'}
                    </Badge>
                    {review.isVerifiedPurchase ? <Badge tone="success">Verified</Badge> : null}
                  </div>
                </div>
                <Rating value={review.rating} />
                {review.product ? (
                  <p className={styles.reviewProduct}>
                    On{' '}
                    <Link to={`/products/${review.product.slug}`}>{review.product.name}</Link>
                  </p>
                ) : (
                  <p className={styles.reviewProduct}>Store review</p>
                )}
                <p className={styles.reviewBody}>
                  {review.body?.trim() || 'No written comment left with this rating.'}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U'
  );
}
