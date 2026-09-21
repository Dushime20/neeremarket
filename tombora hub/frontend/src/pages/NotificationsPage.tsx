import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useMarkNotificationsRead, useMe, useNotifications } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
  const { data: user } = useMe();
  const { data, isLoading, isError, error } = useNotifications();
  const markAll = useMarkNotificationsRead();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container">
        <EmptyState title="Log in to view notifications" actionLabel="Log in" onAction={() => navigate(loginHref('/notifications'))} />
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>Notifications | NeereMarket</title>
      </Helmet>
      <div className={styles.head}>
        <div>
          <h1>Notifications</h1>
          <p>{data?.unreadCount || 0} unread</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={markAll.isPending || !data?.unreadCount}
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </div>
      {isLoading ? <ProductGridSkeleton count={3} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {!isLoading && data?.items.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : null}
      <ul className={styles.list}>
        {data?.items.map((n) => (
          <li key={n.id} className={n.readAt ? undefined : styles.unread}>
            <div>
              <strong>{n.title}</strong>
              {!n.readAt ? <Badge>New</Badge> : null}
              <p>{n.body}</p>
              <small>{new Date(n.createdAt).toLocaleString()}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
