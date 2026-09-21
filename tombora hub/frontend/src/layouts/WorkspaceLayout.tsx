import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLogout, useMe, useNotifications } from '@/api/hooks';
import { APP_LOGO_SRC, APP_NAME } from '@/config/brand';
import { loginHref } from '@/utils/auth';
import styles from './WorkspaceLayout.module.css';

const COLLAPSE_KEY = 'nm_workspace_sidebar_collapsed';

type Variant = 'seller' | 'admin';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: IconName;
};

type IconName =
  | 'overview'
  | 'products'
  | 'orders'
  | 'finance'
  | 'users'
  | 'sellers'
  | 'cms'
  | 'settings'
  | 'audit'
  | 'messages'
  | 'disputes'
  | 'alerts'
  | 'profile'
  | 'payouts'
  | 'onboarding'
  | 'inventory'
  | 'reviews';

const SELLER_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Workspace',
    items: [
      { to: '/seller', label: 'Overview', end: true, icon: 'overview' },
      { to: '/seller/products', label: 'Catalog', icon: 'products' },
      { to: '/seller/inventory', label: 'Inventory', icon: 'inventory' },
      { to: '/seller/reviews', label: 'Reviews', icon: 'reviews' },
      { to: '/seller/orders', label: 'Orders', icon: 'orders' },
      { to: '/seller/finance', label: 'Finance', icon: 'finance' },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/seller/messages', label: 'Messages', icon: 'messages' },
      { to: '/seller/disputes', label: 'Disputes', icon: 'disputes' },
      { to: '/seller/notifications', label: 'Alerts', icon: 'alerts' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/seller/onboarding', label: 'Onboarding', icon: 'onboarding' },
      { to: '/seller/profile', label: 'Profile', icon: 'profile' },
    ],
  },
];

const ADMIN_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Operations',
    items: [
      { to: '/admin', label: 'Overview', end: true, icon: 'overview' },
      { to: '/admin/users', label: 'Users', icon: 'users' },
      { to: '/admin/sellers', label: 'Sellers', icon: 'sellers' },
      { to: '/admin/products', label: 'Products', icon: 'products' },
      { to: '/admin/orders', label: 'Orders', icon: 'orders' },
      { to: '/admin/payouts', label: 'Payouts', icon: 'payouts' },
      { to: '/admin/disputes', label: 'Disputes', icon: 'disputes' },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { to: '/admin/messages', label: 'Messages', icon: 'messages' },
      { to: '/admin/notifications', label: 'Alerts', icon: 'alerts' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/admin/cms', label: 'CMS', icon: 'cms' },
      { to: '/admin/settings', label: 'Settings', icon: 'settings' },
      { to: '/admin/audit', label: 'Audit log', icon: 'audit' },
      { to: '/admin/profile', label: 'Profile', icon: 'profile' },
    ],
  },
];

export function WorkspaceLayout({ variant }: { variant: Variant }) {
  const { data: user, isLoading } = useMe();
  const { data: notifications } = useNotifications();
  const logout = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const groups = variant === 'seller' ? SELLER_GROUPS : ADMIN_GROUPS;
  const unread = notifications?.unreadCount || 0;
  const initials = useMemo(() => initialsFrom(user?.email || user?.phone), [user?.email, user?.phone]);
  const displayName = useMemo(
    () => displayNameFrom(user?.email, user?.phone),
    [user?.email, user?.phone],
  );
  const profileTo = variant === 'seller' ? '/seller/profile' : '/admin/profile';
  const settingsTo = variant === 'seller' ? '/seller/profile' : '/admin/settings';

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const pageTitle = useMemo(() => {
    if (variant === 'seller') {
      if (pathname.startsWith('/seller/products/new')) return 'New listing';
      if (pathname.includes('/edit') && pathname.startsWith('/seller/products/')) return 'Edit listing';
      if (pathname.startsWith('/seller/products/') && pathname !== '/seller/products') return 'Listing details';
      if (pathname.startsWith('/seller/products')) return 'Catalog';
      if (pathname.startsWith('/seller/inventory')) return 'Inventory';
      if (pathname.startsWith('/seller/reviews')) return 'Reviews';
      if (pathname.startsWith('/seller/orders')) return 'Orders';
      if (pathname.startsWith('/seller/finance')) return 'Finance';
      if (pathname.startsWith('/seller/messages')) return 'Messages';
      if (pathname.startsWith('/seller/disputes')) return 'Disputes';
      if (pathname.startsWith('/seller/notifications')) return 'Alerts';
      if (pathname.startsWith('/seller/onboarding')) return 'Onboarding';
      if (pathname.startsWith('/seller/profile')) return 'Profile';
      return 'Overview';
    }
    if (pathname.startsWith('/admin/users')) return 'Users';
    if (pathname.startsWith('/admin/sellers')) return 'Sellers';
    if (pathname.startsWith('/admin/products')) return 'Products';
    if (pathname.startsWith('/admin/orders')) return 'Orders';
    if (pathname.startsWith('/admin/payouts')) return 'Payouts';
    if (pathname.startsWith('/admin/disputes')) return 'Disputes';
    if (pathname.startsWith('/admin/messages')) return 'Messages';
    if (pathname.startsWith('/admin/notifications')) return 'Alerts';
    if (pathname.startsWith('/admin/cms')) return 'CMS';
    if (pathname.startsWith('/admin/settings')) return 'Settings';
    if (pathname.startsWith('/admin/audit')) return 'Audit log';
    if (pathname.startsWith('/admin/profile')) return 'Profile';
    return 'Overview';
  }, [pathname, variant]);

  const pageHint = variant === 'seller' ? 'Seller workspace' : 'Admin console';

  function toggleCollapsed() {
    setCollapsed((value) => !value);
  }

  return (
    <div
      className={`${styles.shell} ${open ? styles.navOpen : ''} ${collapsed ? styles.shellCollapsed : ''}`}
    >
      <aside className={styles.sidebar} aria-label={collapsed ? 'Collapsed navigation' : 'Navigation'}>
        <div className={styles.sidebarHead}>
          <div className={styles.brandRow}>
            <Link to="/" className={styles.brand} onClick={() => setOpen(false)} title={APP_NAME}>
              <img src={APP_LOGO_SRC} alt={APP_NAME} className={styles.logoImg} />
            </Link>
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <CollapseIcon collapsed={collapsed} />
            </button>
          </div>
          <span className={styles.workspaceTag}>
            {variant === 'seller' ? 'Seller workspace' : 'Admin workspace'}
          </span>
        </div>

        <div className={styles.sidebarBody}>
          {groups.map((group) => (
            <nav key={group.label} className={styles.nav} aria-label={group.label}>
              <p className={styles.navLabel}>{group.label}</p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.iconWrap}>
                    <NavIcon name={item.icon} />
                  </span>
                  <span className={styles.navText}>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          ))}
        </div>

        <div className={styles.sideFoot}>
          {variant === 'seller' ? (
            <Link
              to="/seller/products/new"
              className={styles.sideCta}
              onClick={() => setOpen(false)}
              title="New listing"
            >
              <PlusIcon />
              <span className={styles.navText}>New listing</span>
            </Link>
          ) : null}
          <div className={styles.footLinks}>
            <Link
              to="/"
              className={styles.marketLink}
              onClick={() => setOpen(false)}
              title="View marketplace"
            >
              <StoreIcon />
              <span className={styles.navText}>View marketplace</span>
            </Link>
          </div>
          {user ? (
            <div className={styles.sidebarUser}>
              <Link
                to={variant === 'seller' ? '/seller/profile' : '/admin/profile'}
                onClick={() => setOpen(false)}
                aria-label="Profile"
                title={user.email || user.phone || 'Account'}
              >
                <b>{initials}</b>
              </Link>
              <div className={styles.sidebarUserMeta}>
                <strong>{user.email || user.phone || 'Account'}</strong>
                <span>{variant === 'seller' ? 'Seller account' : 'Admin account'}</span>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className={styles.collapseBtnFoot}
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon collapsed={collapsed} />
            <span className={styles.navText}>{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className={styles.context}>
              <p className={styles.contextHint}>{pageHint}</p>
              <h1 className={styles.contextTitle}>{pageTitle}</h1>
            </div>
          </div>

          <div className={styles.topActions}>
            <Link
              to={variant === 'seller' ? '/seller/messages' : '/admin/messages'}
              className={styles.iconBtn}
              aria-label="Messages"
              title="Messages"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 6h16v10H7l-3 3V6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              to={variant === 'seller' ? '/seller/notifications' : '/admin/notifications'}
              className={styles.iconBtn}
              aria-label="Notifications"
              title="Notifications"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zm6 13a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
              {unread > 0 ? <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span> : null}
            </Link>
            <span className={styles.divider} aria-hidden="true" />
            {isLoading ? (
              <div className={styles.accountBtn} aria-hidden>
                <b>..</b>
                <span className={styles.accountName}>Loading</span>
              </div>
            ) : user ? (
              <div className={styles.accountMenu} ref={menuRef}>
                <button
                  type="button"
                  className={`${styles.accountBtn} ${menuOpen ? styles.accountBtnOpen : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((value) => !value)}
                >
                  <b>{initials}</b>
                  <span className={styles.accountName}>{displayName}</span>
                  <ChevronIcon open={menuOpen} />
                </button>
                {menuOpen ? (
                  <div className={styles.accountDropdown} role="menu">
                    <div className={styles.accountDropdownHead}>
                      <b>{initials}</b>
                      <div>
                        <strong>{displayName}</strong>
                        <span>{user.email || user.phone || 'Account'}</span>
                      </div>
                    </div>
                    <Link
                      to={profileTo}
                      role="menuitem"
                      className={styles.accountItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ProfileMenuIcon />
                      Profile
                    </Link>
                    <Link
                      to={settingsTo}
                      role="menuitem"
                      className={styles.accountItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <SettingsMenuIcon />
                      Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className={`${styles.accountItem} ${styles.accountLogout}`}
                      onClick={() => {
                        setMenuOpen(false);
                        logout.mutate(undefined, {
                          onSettled: () => navigate('/'),
                        });
                      }}
                    >
                      <LogoutMenuIcon />
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to={loginHref(pathname)} className={styles.loginLink}>
                Log in
              </Link>
            )}
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function initialsFrom(value?: string | null) {
  if (!value) return 'NM';
  const name = value.includes('@') ? value.split('@')[0] : value;
  return (name || 'NM').slice(0, 2).toUpperCase();
}

function displayNameFrom(email?: string | null, phone?: string | null) {
  if (email) {
    const local = email.split('@')[0] || email;
    return local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }
  if (phone) return phone;
  return 'Account';
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.chevron} aria-hidden="true" data-open={open || undefined}>
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9v-1a7 7 0 0 1 14 0v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L12 2 9.8 6.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1L12 22l2.2-4.1a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2M15 12H3m0 0l3-3m-3 3l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={collapsed ? 'M9 6l6 6-6 6M4 4v16' : 'M15 6l-6 6 6 6M20 4v16'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 10h16v9H4v-9zm2-4h12l2 4H4l2-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIcon({ name }: { name: IconName }) {
  const d: Record<IconName, string> = {
    overview: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8z',
    products: 'M4 7h16M4 12h16M4 17h10',
    orders: 'M7 4h10l2 4H5l2-4zm-2 4h14v12H5V8zm4 4h6',
    finance: 'M4 19V5m0 14h16M8 15l3-4 3 2 4-6',
    users: 'M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m12-13a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 13v-1a4 4 0 0 0-3-3.87',
    sellers: 'M4 10h16v9H4v-9zm2-4h12l2 4H4l2-4z',
    cms: 'M5 5h14v14H5V5zm3 4h8M8 13h5',
    settings:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L12 2 9.8 6.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1L12 22l2.2-4.1a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z',
    audit: 'M8 6h11M8 12h11M8 18h8M5 6h.01M5 12h.01M5 18h.01',
    messages: 'M4 6h16v10H7l-3 3V6z',
    disputes: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z',
    alerts: 'M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zm6 13a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21z',
    profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9v-1a7 7 0 0 1 14 0v1',
    payouts: 'M4 7h16v10H4V7zm2 3h4m8 2h2M7 16h3',
    onboarding: 'M8 3h8v3H8V3zM6 6h12v15H6V6zm3 6h6M9 15h4',
    inventory: 'M4 7l8-4 8 4v13H4V7zm5 13v-6h6v6',
    reviews: 'M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 17.9l.9-5.4-3.9-3.8 5.4-.8L12 3z',
  };

  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d={d[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
