import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useSellerReturns } from '@/api/hooks';
import { Alert, Badge, EmptyState, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

export function SellerDisputesPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data, isLoading, isError, error } = useSellerReturns();

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller/disputes')}
        />
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Disputes | NeereMarket</title>
      </Helmet>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Support</p>
          <h1>Disputes & returns</h1>
          <p>Customer return requests that touch your catalog. Ops reviews refunds.</p>
        </div>
      </header>
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <section className={styles.panel}>
        {!isLoading && !data?.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No disputes yet" description="Returns appear after a delivered order is challenged." />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Refund</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong className={styles.mono}>{row.order.orderNumber}</strong>
                      <small>{new Date(row.createdAt).toLocaleString()}</small>
                    </td>
                    <td>{row.order.customer?.fullName || '—'}</td>
                    <td>
                      {prettyStatus(row.reason)}
                      {row.notes ? <small>{row.notes}</small> : null}
                    </td>
                    <td className={styles.num}>
                      {row.refunds[0] ? formatRwf(row.refunds[0].amount) : '—'}
                    </td>
                    <td>
                      <Badge tone={statusTone(row.status)}>{prettyStatus(row.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
