import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useCart,
  useMe,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { CartLineItem } from '@/components/product';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import styles from './CartPage.module.css';

export function CartPage() {
  const { data: user } = useMe();
  const { data: cart, isLoading, isError, error } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const navigate = useNavigate();
  const hasOutOfStock = (cart?.items || []).some((item) => (item.available ?? 0) < 1);

  if (!user) {
    return (
      <div className="container">
        <EmptyState
          title="Sign in to view your cart"
          description="Your multi-vendor cart is saved to your account."
          actionLabel="Log in"
          onAction={() => navigate(loginHref('/cart'))}
        />
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>Cart | NeereMarket</title>
      </Helmet>
      <h1>Your cart</h1>
      {isLoading ? <ProductGridSkeleton count={2} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {hasOutOfStock ? (
        <Alert tone="error">
          One or more options in your cart are out of stock. Remove them before checkout.
        </Alert>
      ) : null}

      {!isLoading && cart && cart.items.length === 0 ? (
        <EmptyState
          title="Cart is empty"
          description="Browse products from sellers across Rwanda."
          actionLabel="Browse products"
          onAction={() => navigate('/products')}
        />
      ) : null}

      {cart && cart.items.length > 0 ? (
        <div className={styles.layout}>
          <div>
            {cart.sellerGroups.map((group) => (
              <section key={group.sellerId} className={styles.group}>
                <h2>
                  Seller:{' '}
                  <Link to={`/stores/${group.storeSlug}`}>{group.storeName}</Link>
                </h2>
                {cart.items
                  .filter((i) => i.storeSlug === group.storeSlug)
                  .map((item) => (
                    <CartLineItem
                      key={item.id}
                      item={item}
                      busy={updateItem.isPending || removeItem.isPending}
                      onUpdateQty={(id, quantity) =>
                        updateItem.mutate({ itemId: id, quantity })
                      }
                      onRemove={(id) => removeItem.mutate(id)}
                    />
                  ))}
                <p className={styles.groupSub}>Seller subtotal: {formatRwf(group.subtotal)}</p>
              </section>
            ))}
          </div>
          <aside className={styles.summary}>
            <h2>Order summary</h2>
            <p>
              <span>{cart.itemCount} items</span>
              <strong>{formatRwf(cart.subtotal)}</strong>
            </p>
            <p className={styles.note}>Delivery calculated at checkout (RWF).</p>
            <Button type="button" disabled={hasOutOfStock} onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </Button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
