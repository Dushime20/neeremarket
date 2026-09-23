import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart, useCategories, useLogout, useMe, useNotifications, useWishlist } from '@/api/hooks';
import { CategoryMegaMenu } from '@/components/navigation/CategoryMegaMenu';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { APP_LOGO_SRC, APP_NAME } from '@/config/brand';
import { hasSellerAccount, isAdminRole } from '@/utils/auth';
import styles from './MarketplaceLayout.module.css';

export function MarketplaceLayout() {
  const { data: user } = useMe();
  const { data: categories } = useCategories();
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const { data: notifications } = useNotifications();
  const logout = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const isHome = pathname === '/';

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (searchScope && !query) {
      navigate(`/categories/${searchScope}`);
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  const cartCount = cart?.itemCount || 0;
  const wishCount = wishlist?.items.length || 0;
  const unread = notifications?.unreadCount || 0;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link to="/" className={styles.logo} aria-label={`${APP_NAME} home`}>
            <img src={APP_LOGO_SRC} alt={APP_NAME} className={styles.logoImg} />
          </Link>

          <form className={styles.search} onSubmit={onSearch} role="search">
            <label className="sr-only" htmlFor="search-scope">
              Search in
            </label>
            <div className={styles.searchScope}>
              <select
                id="search-scope"
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                aria-label="Search category"
              >
                <option value="">Products</option>
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <svg className={styles.searchScopeChevron} viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M2.5 4.5 6 8l3.5-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <span className={styles.searchDivider} aria-hidden="true" />

            <label className="sr-only" htmlFor="global-search">
              Search products
            </label>
            <input
              id="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Enter a keyword to search products"
            />

            <Link
              to="/image-search"
              className={styles.searchCamera}
              title="Search by image"
              aria-label="Search by image"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.1l1.2-1.5h4.4L15.4 5h2.1A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </Link>

            <button type="submit" className={styles.searchSubmit} aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M16.5 16.5 21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>

          <nav className={styles.actions} aria-label="Account">
            <NavLink
              to="/wishlist"
              className={`${styles.actionIconLink} ${styles.hideOnMobile}`}
              aria-label={wishCount > 0 ? `Wishlist, ${wishCount} saved` : 'Wishlist'}
              title="Wishlist"
            >
              <span className={styles.actionIconWrap}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 20s-7-4.35-7-9.2A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7 3.7C19 15.65 12 20 12 20z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
                {wishCount > 0 ? (
                  <span className={styles.actionBadge}>{wishCount > 9 ? '9+' : wishCount}</span>
                ) : null}
              </span>
              <span className={styles.actionIconLabel}>Wishlist</span>
            </NavLink>
            <NavLink to="/messages" className={styles.hideOnCompact}>
              Messages
            </NavLink>
            <NavLink
              to="/notifications"
              className={`${styles.actionIconLink} ${styles.hideOnMobile}`}
              aria-label={unread > 0 ? `Alerts, ${unread} unread` : 'Alerts'}
              title="Alerts"
            >
              <span className={styles.actionIconWrap}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zm6 13a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
                {unread > 0 ? (
                  <span className={styles.actionBadge}>{unread > 9 ? '9+' : unread}</span>
                ) : null}
              </span>
              <span className={styles.actionIconLabel}>Alerts</span>
            </NavLink>
            <NavLink
              to="/cart"
              className={styles.actionIconLink}
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
              title="Cart"
            >
              <span className={styles.actionIconWrap}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 6h15l-1.5 9H7.5L6 6zm0 0L5 3H2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
                </svg>
                {cartCount > 0 ? (
                  <span className={styles.actionBadge}>{cartCount > 9 ? '9+' : cartCount}</span>
                ) : null}
              </span>
              <span className={styles.actionIconLabel}>Cart</span>
            </NavLink>
            {user ? (
              <>
                <NavLink to="/orders" className={styles.hideOnCompact}>
                  Orders
                </NavLink>
                {!hasSellerAccount(user.roles) && !isAdminRole(user.roles) ? (
                  <NavLink to="/account">Account</NavLink>
                ) : null}
                {hasSellerAccount(user.roles) ? <NavLink to="/seller">Seller</NavLink> : null}
                {isAdminRole(user.roles) ? <NavLink to="/admin">Admin</NavLink> : null}
                <button type="button" className={styles.logout} onClick={() => logout.mutate()}>
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.authJoin} aria-label="Sign In or Join">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M5.5 19.5c1.6-3.2 3.9-4.8 6.5-4.8s4.9 1.6 6.5 4.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Sign In / Join</span>
              </Link>
            )}
          </nav>
        </div>

        <div className={styles.catsWrap}>
          <nav className={`container ${styles.cats}`} aria-label="Marketplace">
            <CategoryMegaMenu categories={categories || []} />
            <span className={styles.navSplit} aria-hidden="true" />
            <NavLink to="/why-neeremarket">Why {APP_NAME}</NavLink>
            <NavLink to="/how-it-works">How it works</NavLink>
            <NavLink to="/sell">For sellers</NavLink>
            <NavLink to="/stores">Stores</NavLink>
          </nav>
        </div>
      </header>

      <main className={`${styles.main} ${isHome ? styles.mainHome : ''}`}>
        <Outlet />
      </main>

      <SiteFooter />
      <MobileBottomNav unreadNotifications={unread} wishlistCount={wishCount} />
    </div>
  );
}
