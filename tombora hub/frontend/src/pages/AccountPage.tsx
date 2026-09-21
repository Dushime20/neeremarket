import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAddresses,
  useLogout,
  useMe,
  useMessageThreads,
  useNotifications,
  useOrders,
  useWishlist,
} from '@/api/hooks';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { greeting, initials } from '@/components/dashboard/metrics';
import { APP_NAME, pageTitle } from '@/config/brand';
import { accountDisplayName, loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './AccountPage.module.css';

export function AccountPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: user, isLoading: userLoading } = useMe();
  const loggedIn = !!user;
  const { data: orders, isLoading: ordersLoading } = useOrders(loggedIn);
  const { data: wishlist } = useWishlist();
  const { data: notifications } = useNotifications();
  const { data: threads } = useMessageThreads(false, loggedIn);
  const { data: addresses, isLoading: addressesLoading } = useAddresses(loggedIn);

  const name = accountDisplayName(user);
  const recentOrders = (orders?.items || []).slice(0, 4);
  const savedAddresses = addresses || [];
  const orderCount = orders?.items.length || 0;
  const wishCount = wishlist?.items.length || 0;
  const unread = notifications?.unreadCount || 0;
  const messageCount = threads?.items.length || 0;

  if (!userLoading && !user) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>{pageTitle('Account')}</title>
        </Helmet>
        <EmptyState
          title="Sign in to your account"
          description={`Track orders, save addresses, and manage your ${APP_NAME} profile.`}
          actionLabel="Sign in"
          onAction={() => navigate(loginHref('/account'))}
        />
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{pageTitle('My account')}</title>
      </Helmet>

      <section className={styles.hero} aria-labelledby="account-heading">
        {userLoading ? (
          <>
            <Skeleton height={56} width={56} />
            <div className={styles.heroCopy}>
              <Skeleton height={14} width="40%" />
              <Skeleton height={22} width="55%" />
            </div>
          </>
        ) : (
          <>
            <div className={styles.avatar} aria-hidden>
              {initials(user?.fullName || user?.email || user?.phone)}
            </div>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>{greeting()}</p>
              <h1 id="account-heading">{name}</h1>
              <p className={styles.meta}>
                {user?.email || user?.phone}
                {user?.email && user?.phone ? ` · ${user.phone}` : null}
              </p>
            </div>
            <div className={styles.heroActions}>
              <Link to="/products">
                <Button type="button" size="sm">
                  Continue shopping
                </Button>
              </Link>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}
              >
                Log out
              </Button>
            </div>
          </>
        )}
      </section>

      <ul className={styles.stats}>
        <li>
          <strong>{orderCount}</strong>
          <span>Orders</span>
        </li>
        <li>
          <strong>{wishCount}</strong>
          <span>Saved items</span>
        </li>
        <li>
          <strong>{messageCount}</strong>
          <span>Conversations</span>
        </li>
        <li>
          <strong>{unread}</strong>
          <span>Unread alerts</span>
        </li>
      </ul>

      <nav className={styles.shortcuts} aria-label="Account shortcuts">
        <Link to="/orders" className={styles.shortcut}>
          <span className={styles.shortcutIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path
                d="M6 7h12l1 14H5L6 7zm3 0V5a3 3 0 0 1 6 0v2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>My orders</strong>
            <em>Track deliveries and past purchases</em>
          </span>
        </Link>
        <Link to="/wishlist" className={styles.shortcut}>
          <span className={styles.shortcutIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path
                d="M12 20s-7-4.35-7-9.2A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7 3.7C19 15.65 12 20 12 20z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>Wishlist</strong>
            <em>Items you saved for later</em>
          </span>
        </Link>
        <Link to="/messages" className={styles.shortcut}>
          <span className={styles.shortcutIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path
                d="M4 6h16v10H7l-3 3V6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>Messages</strong>
            <em>Chat with sellers about products</em>
          </span>
        </Link>
        <Link to="/notifications" className={styles.shortcut}>
          <span className={styles.shortcutIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path
                d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zm6 13a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>Alerts</strong>
            <em>Order and account notifications</em>
          </span>
        </Link>
        <Link to="/checkout" className={styles.shortcut}>
          <span className={styles.shortcutIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path
                d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <span>
            <strong>Addresses</strong>
            <em>Delivery details used at checkout</em>
          </span>
        </Link>
        <Link to="/cart" className={styles.shortcut}>
          <span className={styles.shortcutIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path
                d="M6 6h15l-1.5 9H7.5L6 6zm0 0L5 3H2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>Cart</strong>
            <em>Review items before checkout</em>
          </span>
        </Link>
      </nav>

      <div className={styles.columns}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Recent orders</h2>
            <Link to="/orders">View all</Link>
          </div>
          {ordersLoading ? (
            <div className={styles.skel}>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              compact
              title="No orders yet"
              description="When you checkout, your purchases appear here."
              actionLabel="Browse products"
              onAction={() => navigate('/products')}
            />
          ) : (
            <ul className={styles.orderList}>
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link to={`/orders/${order.id}`} className={styles.orderRow}>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <p>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                        {order.sellerOrders?.length
                          ? ` · ${order.sellerOrders.map((s) => s.sellerName).filter(Boolean).join(', ')}`
                          : null}
                      </p>
                    </div>
                    <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
                    <span className={styles.amount}>{formatRwf(order.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Delivery addresses</h2>
            <Link to="/checkout">Manage</Link>
          </div>
          {addressesLoading ? (
            <div className={styles.skel}>
              <Skeleton height={72} />
              <Skeleton height={72} />
            </div>
          ) : savedAddresses.length === 0 ? (
            <EmptyState
              compact
              title="No saved address"
              description="Add a delivery address the next time you checkout."
              actionLabel="Go to checkout"
              onAction={() => navigate('/checkout')}
            />
          ) : (
            <ul className={styles.addressList}>
              {savedAddresses.map((address) => (
                <li key={address.id} className={styles.address}>
                  <div>
                    <strong>
                      {address.fullName}
                      {address.isDefault ? <Badge tone="brand">Default</Badge> : null}
                    </strong>
                    <p>
                      {[address.landmark, address.district, address.province].filter(Boolean).join(', ')}
                    </p>
                    <p>{address.phone}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
