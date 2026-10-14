import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useSellerDisputes, useSellerReturns } from '@/api/hooks';
import {
  ActionIconButton,
  Alert,
  Badge,
  Button,
  EmptyState,
  SortTh,
  TableBanner,
  TableCard,
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import {
  disputeStatusLabel,
  disputeStatusTone,
  disputeTypeLabel,
  isDisputeActive,
} from '@/utils/disputes';
import styles from './workspace.module.css';

export function SellerDisputesPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data, isLoading, isError, error } = useSellerReturns();
  const disputes = useSellerDisputes();
  const [showClosed, setShowClosed] = useState(false);
  const [disputePage, setDisputePage] = useState(1);
  const [returnPage, setReturnPage] = useState(1);
  const pageSize = 10;

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

  const allDisputes = disputes.data || [];
  const needsReply = allDisputes.filter((d) => d.status === 'OPEN').length;
  const disputeRows = allDisputes.filter((d) => showClosed || isDisputeActive(d.status));
  const totalDisputePages = Math.ceil(disputeRows.length / pageSize);
  const paginatedDisputes = disputeRows.slice((disputePage - 1) * pageSize, disputePage * pageSize);

  const returnRows = data || [];
  const totalReturnPages = Math.ceil(returnRows.length / pageSize);
  const paginatedReturns = returnRows.slice((returnPage - 1) * pageSize, returnPage * pageSize);

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Disputes | NeereMarket</title>
      </Helmet>

      {needsReply > 0 ? (
        <aside className={styles.notice}>
          <p>
            <strong>
              {needsReply} dispute{needsReply === 1 ? '' : 's'} waiting for your reply
            </strong>
            Answer the customer with what happened and how you'll fix it.
          </p>
        </aside>
      ) : null}

      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="Order Disputes & Claims"
          subtitle={
            <span>
              <strong>{needsReply}</strong> waiting for reply · <strong>{disputeRows.length}</strong> disputes in view
            </span>
          }
        />
        <TableToolbar
          filterChips={[
            { id: 'active', label: 'Active Disputes' },
            { id: 'all', label: 'All Disputes' },
          ]}
          activeFilter={showClosed ? 'all' : 'active'}
          onFilterChange={(id) => {
            setShowClosed(id === 'all');
            setDisputePage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        {disputes.isLoading ? <TableSkeleton rows={3} /> : null}
        {disputes.isError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{getErrorMessage(disputes.error)}</Alert>
          </div>
        ) : null}
        {!disputes.isLoading && !disputeRows.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title={showClosed ? 'No disputes yet' : 'No active disputes'} />
          </div>
        ) : null}
        {disputeRows.length ? (
          <>
            {/* Desktop Table View */}
            <div className={`${styles.tableWrap} ${styles.desktopOnlyTable}`}>
              <table className={`${styles.table} ${styles.cardTable}`}>
                <thead>
                  <tr>
                    <SortTh>Dispute</SortTh>
                    <SortTh>Customer</SortTh>
                    <SortTh>Problem</SortTh>
                    <SortTh>Status</SortTh>
                    <SortTh sortable={false}>Actions</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDisputes.map((d) => (
                    <tr key={d.id}>
                      <td data-cell="title">
                        <strong>{d.subject}</strong>
                        <small className={styles.mono}>
                          {d.disputeNumber} · {d.sellerOrderNumber}
                        </small>
                      </td>
                      <td data-label="Customer">{d.customerName}</td>
                      <td data-label="Problem">{disputeTypeLabel(d.type)}</td>
                      <td data-label="Status">
                        <Badge tone={disputeStatusTone(d.status)}>{disputeStatusLabel(d.status)}</Badge>
                        <small>Updated {new Date(d.updatedAt).toLocaleString()}</small>
                      </td>
                      <td data-cell="action">
                        <Link
                          to={`/seller/disputes/${d.id}`}
                          title={d.status === 'OPEN' ? 'Review & reply' : 'View dispute'}
                        >
                          <ActionIconButton
                            icon="view"
                            tone={d.status === 'OPEN' ? 'brand' : 'neutral'}
                            title={d.status === 'OPEN' ? 'Review & reply' : 'View dispute'}
                            aria-label={d.status === 'OPEN' ? 'Review and reply to dispute' : 'View dispute details'}
                          />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile-First Dispute Cards */}
            <div className={styles.mobileOnlyCards}>
              {paginatedDisputes.map((d) => (
                <article key={d.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHead}>
                    <div>
                      <span className={styles.mono} style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4a6c4a' }}>
                        {d.disputeNumber}
                      </span>
                      <span className={styles.mobileCardSubtitle}>Order {d.sellerOrderNumber}</span>
                    </div>
                    <Badge tone={disputeStatusTone(d.status)}>{disputeStatusLabel(d.status)}</Badge>
                  </div>

                  <div className={styles.mobileCardBody}>
                    <h3 className={styles.mobileCardTitle} style={{ fontSize: '0.9375rem', marginBottom: '0.35rem' }}>
                      {d.subject}
                    </h3>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Customer</span>
                      <span className={styles.mobileCardValue}>{d.customerName}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Problem</span>
                      <span className={styles.attrChip}>{disputeTypeLabel(d.type)}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Updated</span>
                      <span className={styles.mobileCardValue}>{new Date(d.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className={styles.mobileCardFoot}>
                    <Link
                      to={`/seller/disputes/${d.id}`}
                      style={{ textDecoration: 'none', width: '100%' }}
                    >
                      <Button
                        type="button"
                        variant={d.status === 'OPEN' ? 'primary' : 'secondary'}
                        style={{ width: '100%', minHeight: 44, justifyContent: 'center' }}
                      >
                        {d.status === 'OPEN' ? 'Review & Reply' : 'View Dispute'}
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
        <TablePagination
          page={disputePage}
          totalPages={totalDisputePages}
          totalItems={disputeRows.length}
          pageSize={pageSize}
          onPageChange={setDisputePage}
        />
      </TableCard>

      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          }
          title="Return Requests"
          subtitle={
            <span>
              <strong>{returnRows.length}</strong> total return requests
            </span>
          }
        />
        {isLoading ? <TableSkeleton /> : null}
        {isError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{getErrorMessage(error)}</Alert>
          </div>
        ) : null}
        {!isLoading && !returnRows.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No returns yet" description="Returns appear after a delivered order is sent back." />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={`${styles.tableWrap} ${styles.desktopOnlyTable}`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <SortTh>Order</SortTh>
                    <SortTh>Customer</SortTh>
                    <SortTh>Reason</SortTh>
                    <SortTh align="right">Refund</SortTh>
                    <SortTh>Status</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReturns.map((row) => (
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

            {/* Mobile-First Return Cards */}
            <div className={styles.mobileOnlyCards}>
              {paginatedReturns.map((row) => (
                <article key={row.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHead}>
                    <div>
                      <span className={styles.mono} style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                        {row.order.orderNumber}
                      </span>
                      <span className={styles.mobileCardSubtitle}>
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge tone={statusTone(row.status)}>{prettyStatus(row.status)}</Badge>
                  </div>

                  <div className={styles.mobileCardBody}>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Customer</span>
                      <span className={styles.mobileCardValue}>{row.order.customer?.fullName || '—'}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Reason</span>
                      <span className={styles.mobileCardValue}>{prettyStatus(row.reason)}</span>
                    </div>
                    {row.notes ? (
                      <div className={styles.mobileCardRow}>
                        <span className={styles.mobileCardLabel}>Notes</span>
                        <span className={styles.mobileCardValue}>{row.notes}</span>
                      </div>
                    ) : null}
                    <div className={styles.mobileCardRow} style={{ marginTop: '0.25rem', paddingTop: '0.35rem', borderTop: '1px dashed #e2e8f0' }}>
                      <span className={styles.mobileCardLabel}>Refund Amount</span>
                      <span className={styles.mobileCardPrice}>
                        {row.refunds[0] ? formatRwf(row.refunds[0].amount) : '—'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        <TablePagination
          page={returnPage}
          totalPages={totalReturnPages}
          totalItems={returnRows.length}
          pageSize={pageSize}
          onPageChange={setReturnPage}
        />
      </TableCard>
    </div>
  );
}
