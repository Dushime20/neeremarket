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
import { Badge, Button, EmptyState, Skeleton, useToast } from '@/components/ui';
import { greeting, initials } from '@/components/dashboard/metrics';
import { APP_NAME, pageTitle } from '@/config/brand';
import { accountDisplayName, isAdminRole, isSellerRole, loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './AccountPage.module.css';

export function AccountPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const toast = useToast();
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

  const hasToken = Boolean(localStorage.getItem('th_access_token'));
  const isSeller = isSellerRole(user?.roles);
  const isAdmin = isAdminRole(user?.roles);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      navigate('/');
    }
  }

  // Loading state while verifying user session on page refresh
  if (userLoading || (hasToken && !user)) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>{pageTitle('Account')}</title>
        </Helmet>
        <section className={styles.hero}>
          <div className={styles.heroProfile}>
            <Skeleton height={56} width={56} />
            <div className={styles.heroCopy}>
              <Skeleton height={14} width="40%" />
              <Skeleton height={22} width="65%" />
            </div>
          </div>
        </section>
        <div className={styles.stats}>
          <Skeleton height={70} />
          <Skeleton height={70} />
          <Skeleton height={70} />
          <Skeleton height={70} />
        </div>
      </div>
    );
  }

  // Unauthenticated Guest View
  if (!user) {
    return (
      <div className={`container ${styles.page}`} style={{ paddingTop: '2rem' }}>
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
        <title>{pageTitle('My Account')}</title>
      </Helmet>

      {/* ── User Profile Hero Card ── */}
      <section className={styles.hero} aria-labelledby="account-heading">
        <div className={styles.heroProfile}>
          <div className={styles.avatar} aria-hidden="true">
            {initials(user?.fullName || user?.email || user?.phone)}
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{greeting()}</p>
            <h1 id="account-heading">{name}</h1>
            <div className={styles.metaRow}>
              <p className={styles.meta}>
                {user?.email || user?.phone}
                {user?.email && user?.phone ? ` · ${user.phone}` : null}
              </p>
              {isSeller ? <Badge tone="brand">Merchant</Badge> : null}
              {isAdmin ? <Badge tone="accent">Admin</Badge> : null}
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link to="/products" className={styles.actionBtn}>
            <Button type="button" size="sm" variant="secondary" style={{ width: '100%', minHeight: '44px' }}>
              Continue shopping
            </Button>
          </Link>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={styles.actionBtn}
            onClick={() => void handleLogout()}
            style={{ minHeight: '44px' }}
          >
            Log out
          </Button>
        </div>
      </section>

      {/* ── Interactive 4-Pill Stats Grid ── */}
      <ul className={styles.stats} aria-label="Account overview statistics">
        <li>
          <Link to="/orders" className={styles.statCard} title="View all orders">
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{orderCount}</span>
            </div>
            <span className={styles.statLabel}>Orders</span>
          </Link>
        </li>
        <li>
          <Link to="/wishlist" className={styles.statCard} title="View saved wishlist">
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{wishCount}</span>
            </div>
            <span className={styles.statLabel}>Wishlist</span>
          </Link>
        </li>
        <li>
          <Link to="/messages" className={styles.statCard} title="View seller messages">
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{messageCount}</span>
            </div>
            <span className={styles.statLabel}>Messages</span>
          </Link>
        </li>
        <li>
          <Link to="/notifications" className={styles.statCard} title="View notification alerts">
            <div className={styles.statNumberRow}>
              <span className={styles.statNumber}>{unread}</span>
              {unread > 0 ? <span className={styles.statDot} aria-label="Unread alerts" /> : null}
            </div>
            <span className={styles.statLabel}>Alerts</span>
          </Link>
        </li>
      </ul>

      {/* ── Merchant / Seller Portal Switcher (If Applicable) ── */}
      {isSeller ? (
        <aside className={styles.sellerPortalCard} aria-label="Merchant portal access">
          <div className={styles.sellerPortalText}>
            <h3>
              <span aria-hidden="true">🏬</span> Merchant Dashboard
            </h3>
            <p>Manage your inventory, fulfill orders, review payouts, and message customers.</p>
          </div>
          <Link to="/seller" className={styles.sellerPortalBtn}>
            Go to Seller Dashboard →
          </Link>
        </aside>
      ) : null}

      {isAdmin ? (
        <aside className={styles.sellerPortalCard} style={{ background: '#f8fafc', borderColor: '#cbd5e1' }} aria-label="Admin console access">
          <div className={styles.sellerPortalText}>
            <h3 style={{ color: '#0f172a' }}>
              <span aria-hidden="true">⚡</span> Platform Administration
            </h3>
            <p style={{ color: '#475569' }}>Access system analytics, order oversight, and dispute arbitration.</p>
          </div>
          <Link to="/admin" className={styles.sellerPortalBtn} style={{ background: '#0f172a' }}>
            Open Admin Console →
          </Link>
        </aside>
      ) : null}

      {/* ── Grouped Mobile Navigation Menu ── */}
      <section className={styles.menuSection} aria-label="Purchases and delivery">
        <h2 className={styles.menuSectionHeader}>Purchases & Delivery</h2>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link to="/orders" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  📦
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>My Orders</p>
                  <p className={styles.menuSubtitle}>Track live shipments & verify delivery receipts</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {orderCount > 0 ? <Badge tone="muted">{orderCount}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/wishlist" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  ❤️
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Saved Wishlist</p>
                  <p className={styles.menuSubtitle}>Products saved for upcoming purchases</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {wishCount > 0 ? <Badge tone="muted">{wishCount}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/cart" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  🛒
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Shopping Cart</p>
                  <p className={styles.menuSubtitle}>Review items and proceed to MoMo checkout</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.menuSection} aria-label="Messages and support">
        <h2 className={styles.menuSectionHeader}>Communication & Support</h2>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link to="/messages" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  💬
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Seller Messages</p>
                  <p className={styles.menuSubtitle}>Direct chat with Rwandan merchants</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {messageCount > 0 ? <Badge tone="muted">{messageCount}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/notifications" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  🔔
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Notifications & Alerts</p>
                  <p className={styles.menuSubtitle}>Order updates, delivery tracking, and system alerts</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {unread > 0 ? <Badge tone="brand">{unread} new</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/disputes" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  ⚖️
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Resolution Center (Disputes)</p>
                  <p className={styles.menuSubtitle}>Report delays, damaged parcels, or request refunds</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.menuSection} aria-label="Account details">
        <h2 className={styles.menuSectionHeader}>Account Settings</h2>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link to="/checkout" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  📍
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Delivery Addresses</p>
                  <p className={styles.menuSubtitle}>Manage delivery addresses across Rwanda</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                {savedAddresses.length > 0 ? <Badge tone="muted">{savedAddresses.length}</Badge> : null}
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>

          <li className={styles.menuItem}>
            <Link to="/contact" className={styles.menuLink}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon} aria-hidden="true">
                  📞
                </span>
                <div className={styles.menuText}>
                  <p className={styles.menuTitle}>Customer Support</p>
                  <p className={styles.menuSubtitle}>Contact the NeereMarket support team</p>
                </div>
              </div>
              <div className={styles.menuRight}>
                <span className={styles.menuChevron} aria-hidden="true">
                  ›
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </section>

      {/* ── 2-Column Responsive Layout: Recent Orders & Saved Addresses ── */}
      <div className={styles.columns}>
        {/* Recent Orders Panel */}
        <section className={styles.panel} aria-label="Recent purchases">
          <header className={styles.panelHead}>
            <h2>
              <span aria-hidden="true">📦</span> Recent Orders
            </h2>
            <Link to="/orders">View all ({orderCount}) →</Link>
          </header>

          {ordersLoading ? (
            <div className={styles.skel}>
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
                  <Link to={`/orders/${order.id}`} className={styles.orderRow} title="View order details">
                    <div className={styles.orderTop}>
                      <span className={styles.orderNumber}>#{order.orderNumber}</span>
                      <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
                    </div>
                    <div className={styles.orderMeta}>
                      <span>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Recent'}
                        {order.sellerOrders?.length
                          ? ` · ${order.sellerOrders.map((s) => s.sellerName).filter(Boolean).join(', ')}`
                          : null}
                      </span>
                      <span className={styles.amount}>{formatRwf(order.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Saved Addresses Panel */}
        <section className={styles.panel} aria-label="Saved addresses">
          <header className={styles.panelHead}>
            <h2>
              <span aria-hidden="true">📍</span> Saved Addresses
            </h2>
            <Link to="/checkout">Manage →</Link>
          </header>

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
                  <div className={styles.addressTop}>
                    <p className={styles.addressName}>{address.fullName}</p>
                    {address.isDefault ? <Badge tone="brand">Default</Badge> : null}
                  </div>
                  <p className={styles.addressLines}>
                    {[address.landmark, address.district, address.province].filter(Boolean).join(', ')}
                  </p>
                  <p className={styles.addressPhone}>📞 {address.phone}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── NeereMarket Escrow Buyer Guarantee Card ── */}
      <section className={styles.escrowCard} aria-label="NeereMarket buyer protection">
        <div className={styles.escrowIcon} aria-hidden="true">
          🛡️
        </div>
        <div className={styles.escrowText}>
          <h4>NeereMarket Escrow Protection</h4>
          <p>
            Every order is protected by our escrow system. Your payment is held safely and only released
            to the merchant after you confirm that your parcel arrived in good condition.
          </p>
        </div>
      </section>
    </div>
  );
}
