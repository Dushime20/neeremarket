import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useMyDisputes, type DisputeSummary } from '@/api/hooks';
import { getErrorMessage } from '@/api/client';
import { Alert, Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { pageTitle } from '@/config/brand';
import { loginHref } from '@/utils/auth';
import {
  disputeStatusLabel,
  disputeStatusTone,
  disputeTypeLabel,
  isDisputeActive,
} from '@/utils/disputes';
import styles from './DisputesPage.module.css';

type Filter = 'active' | 'closed' | 'all';

export function DisputesPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useMe();
  const { data, isLoading, isError, error } = useMyDisputes(undefined, !!user);
  const [filter, setFilter] = useState<Filter>('active');

  if (!userLoading && !user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in to see your disputes"
          description="Open and follow up on problems with your orders."
          actionLabel="Log in"
          onAction={() => navigate(loginHref('/disputes'))}
        />
      </div>
    );
  }

  const all = data || [];
  const activeCount = all.filter((d) => isDisputeActive(d.status)).length;
  const rows = all.filter((d) =>
    filter === 'all' ? true : filter === 'active' ? isDisputeActive(d.status) : !isDisputeActive(d.status),
  );

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>{pageTitle('Resolution center')}</title>
      </Helmet>

      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Resolution center</p>
          <h1>Problems with an order?</h1>
          <p>
            Tell the seller what went wrong, for example a late shipment or a parcel that never
            arrived. Every dispute is sent to NeereMarket support automatically, so we can help
            you and the seller agree on a fix.
          </p>
        </div>
        <Link to="/disputes/new" className={styles.heroCta}>
          <Button type="button">Open a dispute</Button>
        </Link>
      </header>

      <ol className={styles.howItWorks} aria-label="How disputes work">
        <li>
          <span>1</span>
          <div>
            <strong>Report the problem</strong>
            <p>Pick the order and seller, choose what went wrong, and add photos.</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Talk with the seller</strong>
            <p>The seller is notified and replies in the dispute with a fix or new delivery date.</p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>NeereMarket decides</strong>
            <p>Support follows every dispute and records the outcome: redelivery, replacement, or refund.</p>
          </div>
        </li>
      </ol>

      <div className={styles.toolbar}>
        <h2>My disputes</h2>
        <div className={styles.filters} role="tablist">
          {(
            [
              ['active', `Active${activeCount ? ` (${activeCount})` : ''}`],
              ['closed', 'Closed'],
              ['all', 'All'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? styles.chipOn : styles.chip}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {isLoading || userLoading ? (
        <div className={styles.list}>
          <Skeleton height={76} />
          <Skeleton height={76} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          compact
          title={filter === 'active' ? 'No active disputes' : 'Nothing here yet'}
          description="If something goes wrong with a delivery, open a dispute from the order page or here."
        />
      ) : (
        <ul className={styles.list}>
          {rows.map((d) => (
            <DisputeRow key={d.id} dispute={d} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DisputeRow({ dispute }: { dispute: DisputeSummary }) {
  const waitingOnYou = dispute.status === 'SELLER_RESPONDED';
  return (
    <li>
      <Link to={`/disputes/${dispute.id}`} className={styles.card}>
        <div className={styles.cardMain}>
          <p className={styles.cardKicker}>
            {dispute.disputeNumber} · {disputeTypeLabel(dispute.type)}
          </p>
          <strong>{dispute.subject}</strong>
          <p className={styles.cardMeta}>
            {dispute.sellerName} · Order {dispute.orderNumber} · Updated{' '}
            {new Date(dispute.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
          {dispute.lastMessage ? (
            <p className={styles.preview}>{dispute.lastMessage.body}</p>
          ) : null}
        </div>
        <div className={styles.cardSide}>
          <Badge tone={disputeStatusTone(dispute.status)}>{disputeStatusLabel(dispute.status)}</Badge>
          {waitingOnYou ? <span className={styles.yourTurn}>Your reply needed</span> : null}
        </div>
      </Link>
    </li>
  );
}
