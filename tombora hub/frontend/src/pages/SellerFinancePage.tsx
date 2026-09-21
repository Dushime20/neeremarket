import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { useRequestPayout, useSellerFinance } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import { ICONS, MetricIcon } from '@/components/dashboard/metrics';
import styles from './workspace.module.css';

export function SellerFinancePage() {
  const { data: finance, isLoading, isError, error } = useSellerFinance();
  const requestPayout = useRequestPayout();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('+250780000003');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onPayout(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await requestPayout.mutateAsync({
        amount: Number(amount),
        method: 'MTN_MOMO',
        destination: { phone },
      });
      setMsg('Payout requested. Admin can approve and process it.');
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

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Wallet</p>
          <h1>Finance</h1>
          <p>Earnings, commission, and MoMo payouts in RWF.</p>
        </div>
      </header>

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
                <span>Pending</span>
              </div>
              <strong>{formatRwf(finance.wallet.pendingBalance)}</strong>
              <em>Not yet settled</em>
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
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <Input
                    label="MTN MoMo phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finance.payouts.map((p) => (
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
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Bucket</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.ledger.map((e) => (
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
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
