import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { useRequestPayout, useSellerFinance } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, TablePagination, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import { ICONS, MetricIcon } from '@/components/dashboard/metrics';
import styles from './workspace.module.css';

export function SellerFinancePage() {
  const { data: finance, isLoading, isError, error } = useSellerFinance();
  const requestPayout = useRequestPayout();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutPage, setPayoutPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const pageSize = 10;
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onPayout(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await requestPayout.mutateAsync({ amount: Number(amount), destination: { phone } });
      setMsg('Withdrawal requested. Once NeereMarket approves it, the money is sent to your Mobile Money wallet.');
      setAmount('');
    } catch (ex) {
      setErr(getErrorMessage(ex));
    }
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Seller finance | NeereMarket</title>
      </Helmet>

      {isLoading ? <TableSkeleton rows={4} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {err ? <Alert tone="error">{err}</Alert> : null}

      {finance ? (
        <>
          <section className={styles.kpis} aria-label="Wallet">
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone="ok">
                  <MetricIcon path={ICONS.wallet} />
                </span>
                <span>Available</span>
              </div>
              <strong>{formatRwf(finance.wallet.availableBalance)}</strong>
              <em>Can request payout</em>
            </article>
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone="warn">
                  <MetricIcon path={ICONS.hold} />
                </span>
                <span>On hold</span>
              </div>
              <strong>{formatRwf(finance.wallet.pendingBalance)}</strong>
              <em>Released when customers confirm delivery</em>
            </article>
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone="brand">
                  <MetricIcon path={ICONS.trend} />
                </span>
                <span>Earnings</span>
              </div>
              <strong>{formatRwf(finance.totals.earnings)}</strong>
              <em>{finance.totals.orders} paid orders</em>
            </article>
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone="accent">
                  <MetricIcon path={ICONS.bag} />
                </span>
                <span>Commission</span>
              </div>
              <strong>{formatRwf(finance.totals.commission)}</strong>
              <em>Withdrawn {formatRwf(finance.totals.withdrawals)}</em>
            </article>
          </section>

          <section className={styles.split}>
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Request payout</h2>
              </div>
              <div className={styles.panelBody}>
                <form className={styles.form} onSubmit={onPayout}>
                  <Input
                    label="Amount (RWF)"
                    type="number"
                    min={100}
                    max={Number(finance.wallet.availableBalance) || undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <Input
                    label="MTN MoMo or Airtel Money number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0780 000 000"
                    required
                  />
                  <Button type="submit" disabled={requestPayout.isPending}>
                    {requestPayout.isPending ? 'Submitting…' : 'Request withdrawal'}
                  </Button>
                </form>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Payout requests</h2>
              </div>
              {!finance.payouts.length ? (
                <div className={styles.panelBody}>
                  <EmptyState title="No payouts yet" />
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className={`${styles.tableWrap} ${styles.desktopOnlyTable}`}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(finance.payouts || [])
                          .slice((payoutPage - 1) * pageSize, payoutPage * pageSize)
                          .map((p) => (
                            <tr key={p.id}>
                              <td className={styles.num}>{formatRwf(p.amount)}</td>
                              <td>{p.method.replace(/_/g, ' ')}</td>
                              <td>
                                <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile-First Payout Cards */}
                  <div className={styles.mobileOnlyCards}>
                    {(finance.payouts || [])
                      .slice((payoutPage - 1) * pageSize, payoutPage * pageSize)
                      .map((p) => (
                        <article key={p.id} className={styles.mobileCard}>
                          <div className={styles.mobileCardHead}>
                            <div>
                              <span className={styles.mobileCardPrice}>{formatRwf(p.amount)}</span>
                              <span className={styles.mobileCardSubtitle} style={{ marginTop: '0.2rem' }}>
                                {p.method.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                          </div>
                        </article>
                      ))}
                  </div>

                  <TablePagination
                    page={payoutPage}
                    totalPages={Math.ceil((finance.payouts || []).length / pageSize)}
                    totalItems={(finance.payouts || []).length}
                    pageSize={pageSize}
                    onPageChange={setPayoutPage}
                  />
                </>
              )}
            </article>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Ledger</h2>
            </div>
            {!finance.ledger.length ? (
              <div className={styles.panelBody}>
                <EmptyState
                  title="No ledger entries yet"
                  description="Entries appear after paid orders."
                />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className={`${styles.tableWrap} ${styles.desktopOnlyTable}`}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Bucket</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(finance.ledger || [])
                        .slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize)
                        .map((e) => (
                          <tr key={e.id}>
                            <td>
                              <strong>{prettyStatus(e.entryType)}</strong>
                              <small>{e.description}</small>
                            </td>
                            <td>{prettyStatus(e.balanceBucket)}</td>
                            <td className={`${styles.num} ${Number(e.amount) < 0 ? styles.neg : styles.pos}`}>
                              {formatRwf(e.amount)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile-First Ledger Cards */}
                <div className={styles.mobileOnlyCards}>
                  {(finance.ledger || [])
                    .slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize)
                    .map((e) => (
                      <article key={e.id} className={styles.mobileCard}>
                        <div className={styles.mobileCardHead}>
                          <div>
                            <h3 className={styles.mobileCardTitle}>{prettyStatus(e.entryType)}</h3>
                            {e.description ? (
                              <span className={styles.mobileCardSubtitle}>{e.description}</span>
                            ) : null}
                          </div>
                          <span
                            className={styles.mobileCardPrice}
                            style={{
                              color: Number(e.amount) < 0 ? '#b91c1c' : '#15803d',
                              fontSize: '0.95rem',
                            }}
                          >
                            {Number(e.amount) > 0 ? `+${formatRwf(e.amount)}` : formatRwf(e.amount)}
                          </span>
                        </div>
                        <div className={styles.mobileCardBody} style={{ paddingTop: '0.2rem' }}>
                          <span className={styles.attrChip}>Bucket: {prettyStatus(e.balanceBucket)}</span>
                        </div>
                      </article>
                    ))}
                </div>

                <TablePagination
                  page={ledgerPage}
                  totalPages={Math.ceil((finance.ledger || []).length / pageSize)}
                  totalItems={(finance.ledger || []).length}
                  pageSize={pageSize}
                  onPageChange={setLedgerPage}
                />
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
