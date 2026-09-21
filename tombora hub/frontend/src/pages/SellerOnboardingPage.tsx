import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useSaveSellerOnboarding, useSellerOnboarding } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

function metaValue(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = meta?.[key];
  return value == null ? '' : String(value);
}

export function SellerOnboardingPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: onboarding, isLoading, isError, error } = useSellerOnboarding();
  const save = useSaveSellerOnboarding();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    idNumber: '',
    fullName: '',
    idIssuedAt: '',
    registrationNumber: '',
    businessType: '',
    regIssuedAt: '',
    tin: '',
    taxOffice: '',
    method: 'MTN_MOMO',
    phone: '',
    accountName: '',
  });

  useEffect(() => {
    if (!onboarding?.verification) return;
    const { nationalIdMeta, businessRegMeta, taxMeta, payoutMeta } = onboarding.verification;
    setForm({
      idNumber: metaValue(nationalIdMeta, 'idNumber'),
      fullName: metaValue(nationalIdMeta, 'fullName'),
      idIssuedAt: metaValue(nationalIdMeta, 'issuedAt'),
      registrationNumber: metaValue(businessRegMeta, 'registrationNumber'),
      businessType: metaValue(businessRegMeta, 'businessType'),
      regIssuedAt: metaValue(businessRegMeta, 'issuedAt'),
      tin: metaValue(taxMeta, 'tin'),
      taxOffice: metaValue(taxMeta, 'taxOffice'),
      method: metaValue(payoutMeta, 'method') || 'MTN_MOMO',
      phone: metaValue(payoutMeta, 'phone'),
      accountName: metaValue(payoutMeta, 'accountName'),
    });
  }, [onboarding]);

  const locked = useMemo(() => {
    const status = onboarding?.verificationStatus;
    return status === 'VERIFIED' || status === 'UNDER_REVIEW' || status === 'SUSPENDED';
  }, [onboarding?.verificationStatus]);

  const canSubmitNow = useMemo(() => {
    if (!onboarding || locked) return false;
    const profileReady = onboarding.steps
      .filter((s) => s.id === 'profile' || s.id === 'branding')
      .every((s) => s.done);
    const kycReady = [
      form.idNumber,
      form.fullName,
      form.registrationNumber,
      form.tin,
      form.phone,
      form.accountName,
    ].every((v) => v.trim().length > 0);
    return profileReady && kycReady;
  }, [onboarding, locked, form]);

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller/onboarding')}
        />
      </div>
    );
  }

  function payload() {
    return {
      nationalIdMeta: {
        idNumber: form.idNumber,
        fullName: form.fullName,
        issuedAt: form.idIssuedAt,
      },
      businessRegMeta: {
        registrationNumber: form.registrationNumber,
        businessType: form.businessType,
        issuedAt: form.regIssuedAt,
      },
      taxMeta: {
        tin: form.tin,
        taxOffice: form.taxOffice,
      },
      payoutMeta: {
        method: form.method,
        phone: form.phone,
        accountName: form.accountName,
      },
    };
  }

  async function persist(submit: boolean) {
    setMsg(null);
    setErr(null);
    try {
      await save.mutateAsync({ ...payload(), submit });
      setMsg(submit ? 'Submitted for review' : 'Onboarding saved');
    } catch (ex) {
      setErr(getErrorMessage(ex));
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    await persist(false);
  }

  const progress = onboarding?.progress;
  const percent = progress ? Math.round((progress.completed / progress.total) * 100) : 0;
  const status = onboarding?.verificationStatus || 'PENDING';

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Seller onboarding | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Verification</p>
          <h1>Onboarding</h1>
          <p>
            Complete KYC and payout details so admin can verify {onboarding?.businessName || 'your store'}.{' '}
            <Badge tone={statusTone(status)}>{prettyStatus(status)}</Badge>
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/seller/profile">
            <Button type="button" size="sm" variant="secondary">
              Store profile
            </Button>
          </Link>
        </div>
      </header>

      {isLoading ? <TableSkeleton rows={6} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {err ? <Alert tone="error">{err}</Alert> : null}

      {onboarding ? (
        <>
          {status === 'REJECTED' && onboarding.verification?.reviewNotes ? (
            <aside className={styles.notice} data-tone="danger">
              <p>
                <strong>Verification was rejected</strong>
                {onboarding.verification.reviewNotes}
              </p>
            </aside>
          ) : null}
          {status === 'UNDER_REVIEW' ? (
            <aside className={styles.notice} data-tone="info">
              <p>
                <strong>Under review</strong>
                Our team is checking your documents. You can still view this checklist.
              </p>
            </aside>
          ) : null}
          {status === 'VERIFIED' ? (
            <aside className={styles.notice} data-tone="ok">
              <p>
                <strong>Store verified</strong>
                Your KYC and payout details are on file.
              </p>
            </aside>
          ) : null}

          <section className={styles.progressCard} aria-label="Onboarding progress">
            <div>
              <strong>
                {progress?.completed}/{progress?.total} steps complete
              </strong>
              <p className={styles.muted}>{percent}% ready for review</p>
            </div>
            <span className={styles.progressTrack}>
              <i style={{ width: `${percent}%` }} />
            </span>
          </section>

          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>KYC & payout</h2>
              </div>
              <div className={styles.panelBody}>
                <form className={`${styles.form} ${styles.formWide}`} onSubmit={onSave}>
                  <fieldset className={styles.fieldset} disabled={locked}>
                    <legend>National ID</legend>
                    <Input
                      label="ID number"
                      value={form.idNumber}
                      onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                    />
                    <Input
                      label="Name on ID"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    />
                    <Input
                      label="Issue date"
                      type="date"
                      value={form.idIssuedAt}
                      onChange={(e) => setForm({ ...form, idIssuedAt: e.target.value })}
                    />
                  </fieldset>

                  <fieldset className={styles.fieldset} disabled={locked}>
                    <legend>Business registration</legend>
                    <Input
                      label="Registration number"
                      value={form.registrationNumber}
                      onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                    />
                    <Input
                      label="Business type"
                      value={form.businessType}
                      onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                      placeholder="Sole proprietor, Ltd, cooperative"
                    />
                    <Input
                      label="Issue date"
                      type="date"
                      value={form.regIssuedAt}
                      onChange={(e) => setForm({ ...form, regIssuedAt: e.target.value })}
                    />
                  </fieldset>

                  <fieldset className={styles.fieldset} disabled={locked}>
                    <legend>Tax</legend>
                    <Input
                      label="TIN"
                      value={form.tin}
                      onChange={(e) => setForm({ ...form, tin: e.target.value })}
                    />
                    <Input
                      label="Tax office / RRA center"
                      value={form.taxOffice}
                      onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
                    />
                  </fieldset>

                  <fieldset className={styles.fieldset} disabled={locked}>
                    <legend>Payout destination</legend>
                    <label className={styles.select}>
                      Method
                      <select
                        value={form.method}
                        onChange={(e) => setForm({ ...form, method: e.target.value })}
                      >
                        <option value="MTN_MOMO">MTN MoMo</option>
                        <option value="AIRTEL_MONEY">Airtel Money</option>
                      </select>
                    </label>
                    <Input
                      label="Mobile money number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <Input
                      label="Account name"
                      value={form.accountName}
                      onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    />
                  </fieldset>

                  {locked ? (
                    <p className={styles.muted}>
                      {status === 'VERIFIED'
                        ? 'Verified stores cannot change KYC from this tab.'
                        : 'Details are locked while this store is under review.'}
                    </p>
                  ) : (
                    <div className={styles.actions}>
                      <Button type="submit" variant="secondary" disabled={save.isPending}>
                        {save.isPending ? 'Saving…' : 'Save draft'}
                      </Button>
                      <Button
                        type="button"
                        disabled={save.isPending || !canSubmitNow}
                        onClick={() => void persist(true)}
                      >
                        Submit for review
                      </Button>
                    </div>
                  )}
                </form>
                {!canSubmitNow && !locked ? (
                  <p className={styles.muted} style={{ marginTop: '0.75rem' }}>
                    Finish every checklist item, including store profile and branding, before submitting.
                  </p>
                ) : null}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Checklist</h2>
              </div>
              <ol className={styles.steps}>
                {onboarding.steps.map((step, index) => (
                  <li key={step.id} className={styles.step} data-done={step.done || undefined}>
                    <span className={styles.stepIndex}>{step.done ? 'âœ“' : index + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.hint}</p>
                      {step.href && !step.done && !locked ? (
                        <Link to={step.href} className={styles.link}>
                          Complete in profile
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
