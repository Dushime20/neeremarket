import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMarkNotificationsRead, useMe, useNotifications } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from '../workspace.module.css';

export function AlertsPage() {
  const { data: user } = useMe();
  const { data, isLoading, isError, error } = useNotifications();
  const markAll = useMarkNotificationsRead();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Log in to view alerts"
          actionLabel="Log in"
          onAction={() => navigate(loginHref(pathname))}
        />
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Alerts | NeereMarket</title>
      </Helmet>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Inbox</p>
          <h1>Alerts</h1>
          <p>{data?.unreadCount || 0} unread notifications</p>
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
      </header>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <section className={styles.panel}>
        {!isLoading && data?.items.length === 0 ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No notifications yet" />
          </div>
        ) : (
          <ul className={styles.alertList}>
            {data?.items.map((n) => (
              <li key={n.id} className={n.readAt ? undefined : styles.unread}>
                <div>
                  <strong>{n.title}</strong>
                  {!n.readAt ? (
                    <>
                      {' '}
                      <Badge>New</Badge>
                    </>
                  ) : null}
                  <p className={styles.muted}>{n.body}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
