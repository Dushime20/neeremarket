import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useRemoveFromWishlist, useWishlist } from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { ProductCard } from '@/components/product';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from './WishlistPage.module.css';

export function WishlistPage() {
  const { data: user } = useMe();
  const { data: wishlist, isLoading, isError, error } = useWishlist();
  const remove = useRemoveFromWishlist();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in to see your wishlist"
          actionLabel="Log in"
          onAction={() => navigate(loginHref('/wishlist'))}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <Helmet>
        <title>Wishlist | NeereMarket</title>
      </Helmet>
      <h1>Wishlist</h1>
      {isLoading ? <ProductGridSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {!isLoading && wishlist?.items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save products to track price and stock later."
          actionLabel="Browse products"
          onAction={() => navigate('/products')}
        />
      ) : null}
      <div className={styles.grid}>
        {wishlist?.items.map((item) => (
          <div key={item.id} className={styles.item}>
            <ProductCard product={item.product} />
            <div className={styles.actions}>
              <Link to={`/products/${item.product.slug}`}>
                <Button type="button" size="sm" variant="secondary">
                  View
                </Button>
              </Link>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={remove.isPending}
                onClick={() => remove.mutate(item.variantId)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
