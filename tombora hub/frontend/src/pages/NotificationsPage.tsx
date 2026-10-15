import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useMarkNotificationRead, useMarkNotificationsRead, useMe, useNotifications } from '@/api/hooks';
import { Alert, Badge, EmptyState, ProductGridSkeleton, useToast } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from './NotificationsPage.module.css';

type NotificationFilter = 'ALL' | 'UNREAD' | 'ORDERS' | 'PAYMENTS' | 'DISPUTES';

function formatRelativeTime(isoDate: string) {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(isoDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return isoDate;
  }
}

function getNotificationCategory(type: string, data?: Record<string, unknown> | null) {
  const t = (type || '').toUpperCase();
  if (t.includes('ORDER') || t.includes('DELIVER') || t.includes('SHIP') || data?.orderId) {
    return 'ORDERS';
  }
  if (t.includes('PAYMENT') || t.includes('PAYOUT') || t.includes('WALLET') || data?.paymentId) {
    return 'PAYMENTS';
  }
  if (t.includes('DISPUTE') || data?.disputeId) {
    return 'DISPUTES';
  }
  return 'GENERAL';
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'ORDERS':
      return { icon: '📦', className: styles.iconOrders };
    case 'PAYMENTS':
      return { icon: '💳', className: styles.iconPayments };
    case 'DISPUTES':
      return { icon: '🛡️', className: styles.iconDisputes };
    default:
      return { icon: '🔔', className: '' };
  }
}

export function NotificationsPage() {
  const { data: user, isLoading: isUserLoading } = useMe();
  const { data, isLoading, isError, error } = useNotifications();
  const markAll = useMarkNotificationsRead();
  const markSingle = useMarkNotificationRead();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<NotificationFilter>('ALL');

  const allItems = useMemo(() => data?.items || [], [data?.items]);

  // Compute filter counts
  const counts = useMemo(() => {
    let unread = 0;
    let orders = 0;
    let payments = 0;
    let disputes = 0;

    for (const item of allItems) {
      if (!item.readAt) unread += 1;
      const cat = getNotificationCategory(item.type, item.data);
      if (cat === 'ORDERS') orders += 1;
      if (cat === 'PAYMENTS') payments += 1;
      if (cat === 'DISPUTES') disputes += 1;
    }

    return { all: allItems.length, unread, orders, payments, disputes };
  }, [allItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (activeTab === 'UNREAD') return !item.readAt;
      if (activeTab === 'ORDERS') return getNotificationCategory(item.type, item.data) === 'ORDERS';
      if (activeTab === 'PAYMENTS') return getNotificationCategory(item.type, item.data) === 'PAYMENTS';
      if (activeTab === 'DISPUTES') return getNotificationCategory(item.type, item.data) === 'DISPUTES';
      return true;
    });
  }, [allItems, activeTab]);

  async function handleMarkAll() {
    try {
      await markAll.mutateAsync();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not mark notifications as read'));
    }
  }

  async function handleMarkSingle(id: string) {
    try {
      await markSingle.mutateAsync(id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not mark notification as read'));
    }
  }

  const hasToken = Boolean(localStorage.getItem('th_access_token'));

  // Auth & Session Loading Guard on page refresh
  if (isUserLoading || (hasToken && isLoading)) {
    return (
      <div className={`container ${styles.page}`}>
        <Helmet>
          <title>{`Notifications | NeereMarket`}</title>
        </Helmet>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Notifications</h1>
            <p className={styles.subtitle}>Loading notifications…</p>
          </div>
        </div>
        <ProductGridSkeleton count={3} />
      </div>
    );
  }

  // Unauthenticated Guest View
  if (!user) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <EmptyState
          title="Sign in to view notifications"
          description="Track your orders, delivery status, escrow releases, and merchant replies."
          actionLabel="Log In"
          onAction={() => navigate(loginHref('/notifications'))}
        />
      </div>
    );
  }

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''} | NeereMarket`}</title>
      </Helmet>

      {/* ── Page Header ── */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Notifications</h1>
            {unreadCount > 0 ? (
              <span className={styles.unreadCountBadge}>
                {unreadCount} {unreadCount === 1 ? 'new' : 'new'}
              </span>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Order updates, delivery tracking alerts, and merchant communications.
          </p>
        </div>

        <button
          type="button"
          className={styles.markAllBtn}
          disabled={markAll.isPending || unreadCount === 0}
          onClick={() => void handleMarkAll()}
          title="Mark all notifications as read"
        >
          <span aria-hidden="true">✓</span>
          {markAll.isPending ? 'Marking…' : 'Mark all as read'}
        </button>
      </header>

      {/* ── Filter Tabs (Mobile Scrollable) ── */}
      {allItems.length > 0 ? (
        <nav className={styles.tabsBar} role="tablist" aria-label="Notification Filters">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('ALL')}
            role="tab"
            aria-selected={activeTab === 'ALL'}
          >
            <span>All</span>
            <span className={styles.tabCount}>{counts.all}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'UNREAD' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('UNREAD')}
            role="tab"
            aria-selected={activeTab === 'UNREAD'}
          >
            <span>Unread</span>
            {counts.unread > 0 ? (
              <span className={styles.tabCount}>{counts.unread}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'ORDERS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('ORDERS')}
            role="tab"
            aria-selected={activeTab === 'ORDERS'}
          >
            <span>Orders & Delivery</span>
            {counts.orders > 0 ? (
              <span className={styles.tabCount}>{counts.orders}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'PAYMENTS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('PAYMENTS')}
            role="tab"
            aria-selected={activeTab === 'PAYMENTS'}
          >
            <span>Payments</span>
            {counts.payments > 0 ? (
              <span className={styles.tabCount}>{counts.payments}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'DISPUTES' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('DISPUTES')}
            role="tab"
            aria-selected={activeTab === 'DISPUTES'}
          >
            <span>Disputes</span>
            {counts.disputes > 0 ? (
              <span className={styles.tabCount}>{counts.disputes}</span>
            ) : null}
          </button>
        </nav>
      ) : null}

      {/* ── Error Alert ── */}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {/* ── Global Empty State (No Notifications) ── */}
      {!isLoading && allItems.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconCircle} aria-hidden="true">
            🔔
          </div>
          <h2 className={styles.emptyTitle}>No notifications yet</h2>
          <p className={styles.emptyDesc}>
            When you place an order, receive delivery updates, or receive merchant messages, they
            will appear here.
          </p>
        </div>
      ) : null}

      {/* ── Tab Filtered Empty State ── */}
      {!isLoading && allItems.length > 0 && filteredItems.length === 0 ? (
        <div className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>All caught up!</h2>
          <p className={styles.emptyDesc}>
            There are no notifications matching the &quot;{activeTab.toLowerCase()}&quot; filter.
          </p>
        </div>
      ) : null}

      {/* ── Notifications List ── */}
      <ul className={styles.list} aria-label="Notifications list">
        {filteredItems.map((n) => {
          const isUnread = !n.readAt;
          const category = getNotificationCategory(n.type, n.data);
          const iconMeta = getCategoryIcon(category);
          const orderId = n.data?.orderId as string | undefined;
          const disputeId = n.data?.disputeId as string | undefined;

          return (
            <li
              key={n.id}
              className={`${styles.card} ${isUnread ? styles.cardUnread : ''}`}
            >
              <div
                className={`${styles.iconWrap} ${iconMeta.className}`}
                aria-hidden="true"
              >
                {iconMeta.icon}
              </div>

              <div className={styles.content}>
                <div className={styles.cardHead}>
                  <div className={styles.titleWrap}>
                    {isUnread ? <span className={styles.unreadPulseDot} aria-label="Unread" /> : null}
                    <h2 className={styles.cardTitle}>{n.title}</h2>
                    {isUnread ? <Badge tone="brand">New</Badge> : null}
                  </div>
                  <time className={styles.time} dateTime={n.createdAt}>
                    {formatRelativeTime(n.createdAt)}
                  </time>
                </div>

                <p className={styles.body}>{n.body}</p>

                {/* Quick Interactive Actions */}
                <div className={styles.cardActions}>
                  {orderId ? (
                    <Link to={`/orders/${orderId}`} className={styles.actionLink}>
                      View Order Details →
                    </Link>
                  ) : null}

                  {disputeId ? (
                    <Link to={`/disputes/${disputeId}`} className={styles.actionLink}>
                      View Dispute →
                    </Link>
                  ) : null}

                  {isUnread ? (
                    <button
                      type="button"
                      className={styles.markSingleReadBtn}
                      onClick={() => void handleMarkSingle(n.id)}
                      title="Mark as read"
                    >
                      <span aria-hidden="true">✓</span> Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
