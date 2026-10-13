import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  useDispute,
  usePostDisputeMessage,
  useResolveDispute,
  useUploadDisputeEvidence,
  useWithdrawDispute,
  type DisputeDetail,
  type DisputeResolution,
} from '@/api/hooks';
import { getErrorMessage } from '@/api/client';
import { Alert, Badge, Button, Skeleton, useConfirm, useToast } from '@/components/ui';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import {
  RESOLUTION_OPTIONS,
  disputeStatusLabel,
  disputeStatusTone,
  disputeTypeLabel,
  resolutionLabel,
} from '@/utils/disputes';
import styles from './DisputeThread.module.css';

type Props = {
  id: string;
  backTo: string;
  backLabel: string;
  /** Marketplace pages have a fixed bottom nav on mobile that the sticky composer must clear. */
  layout?: 'marketplace' | 'workspace';
};

const ROLE_LABEL = { CUSTOMER: 'Customer', SELLER: 'Seller', ADMIN: 'NeereMarket', SYSTEM: 'Update' } as const;

export function DisputeThread({ id, backTo, backLabel, layout = 'marketplace' }: Props) {
  const { data: dispute, isLoading, isError, error } = useDispute(id);

  if (isLoading) {
    return (
      <div className={styles.wrap} data-layout={layout}>
        <Skeleton height={120} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (isError || !dispute) {
    return (
      <div className={styles.wrap} data-layout={layout}>
        <Link to={backTo} className={styles.back}>
          ← {backLabel}
        </Link>
        <Alert tone="error">{getErrorMessage(error, 'Dispute not found')}</Alert>
      </div>
    );
  }

  return (
    <div className={styles.wrap} data-layout={layout}>
      <Link to={backTo} className={styles.back}>
        ← {backLabel}
      </Link>

      <header className={styles.head}>
        <div className={styles.headCopy}>
          <p className={styles.kicker}>
            {dispute.disputeNumber} · {disputeTypeLabel(dispute.type)}
          </p>
          <h1>{dispute.subject}</h1>
          <p className={styles.meta}>
            Order{' '}
            {dispute.viewer.role === 'CUSTOMER' ? (
              <Link to={`/orders/${dispute.order.id}`}>{dispute.order.orderNumber}</Link>
            ) : dispute.viewer.role === 'ADMIN' ? (
              <Link to={`/admin/orders/${dispute.order.id}`}>{dispute.order.orderNumber}</Link>
            ) : (
              <strong>{dispute.order.orderNumber}</strong>
            )}{' '}
            · Parcel {dispute.sellerOrder.sellerOrderNumber} · Opened{' '}
            {new Date(dispute.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <Badge tone={disputeStatusTone(dispute.status)}>{disputeStatusLabel(dispute.status)}</Badge>
      </header>

      <NextStep dispute={dispute} />

      <div className={styles.grid}>
        <section className={styles.panel} aria-label="Conversation">
          <div className={styles.panelHead}>
            <h2>Conversation</h2>
            <small>Visible to the customer, the seller and NeereMarket support</small>
          </div>
          <Conversation dispute={dispute} />
          {dispute.viewer.canReply ? (
            <Composer dispute={dispute} />
          ) : (
            <p className={styles.closedNote}>This dispute is closed. Replies are disabled.</p>
          )}
        </section>

        <aside className={styles.aside}>
          {dispute.resolution ? <Decision dispute={dispute} /> : null}
          {dispute.viewer.canResolve ? <ResolvePanel dispute={dispute} /> : null}
          <Actions dispute={dispute} />
          <ParcelCard dispute={dispute} />
          <PartiesCard dispute={dispute} />
        </aside>
      </div>
    </div>
  );
}

function NextStep({ dispute }: { dispute: DisputeDetail }) {
  const role = dispute.viewer.role;
  const seller = dispute.seller.businessName;
  let text: string | null = null;

  switch (dispute.status) {
    case 'OPEN':
      text =
        role === 'CUSTOMER'
          ? `We notified ${seller} and NeereMarket support. Talk with the seller here; support follows the conversation and will decide if you can't agree.`
          : role === 'SELLER'
            ? 'The customer is waiting for your reply. Explain what happened and what you will do, for example a new delivery date. NeereMarket support can see this conversation.'
            : 'Waiting for the seller to reply. Post a message at any time to join the conversation, then record a decision.';
      break;
    case 'SELLER_RESPONDED':
      text =
        role === 'CUSTOMER'
          ? `${seller} replied. If the problem is fixed you can close the dispute. Otherwise keep talking here; NeereMarket support will step in with a decision.`
          : role === 'SELLER'
            ? 'Waiting for the customer to respond. NeereMarket support is following the conversation.'
            : 'The seller has replied. Join the conversation or record a decision when you are ready.';
      break;
    case 'ESCALATED':
      text =
        role === 'ADMIN'
          ? 'Support has joined. Ask both sides for anything missing, then record a decision.'
          : 'NeereMarket support has joined this dispute. Answer any questions here; the decision will be posted in this conversation.';
      break;
    case 'WITHDRAWN':
      text = 'The customer closed this dispute.';
      break;
    default:
      text = null;
  }

  if (!text) return null;
  return (
    <div className={styles.nextStep} data-status={dispute.status}>
      <strong>What happens next</strong>
      <p>{text}</p>
    </div>
  );
}

function Attachments({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <ul className={styles.attachments}>
      {urls.map((url) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noreferrer noopener">
            {/\.(mp4|webm|mov)$/i.test(url) ? (
              <span className={styles.fileChip}>Video</span>
            ) : (
              <img src={url} alt="Evidence" loading="lazy" />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Conversation({ dispute }: { dispute: DisputeDetail }) {
  const openerMine = dispute.viewer.role === 'CUSTOMER';
  const logRef = useRef<HTMLOListElement>(null);
  const count = dispute.messages.length;

  useEffect(() => {
    const el = logRef.current;
    if (el && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
  }, [count]);

  return (
    <ol ref={logRef} className={styles.log}>
      <li className={openerMine ? styles.mine : styles.theirs} data-role="CUSTOMER">
        <div className={styles.bubble}>
          <div className={styles.author}>
            <strong>{openerMine ? 'You' : dispute.customer.fullName}</strong>
            <span className={styles.roleChip} data-role="CUSTOMER">
              Customer
            </span>
          </div>
          <p className={styles.body}>{dispute.description}</p>
          {dispute.desiredOutcome ? (
            <p className={styles.wants}>
              Would like: <strong>{resolutionLabel(dispute.desiredOutcome)}</strong>
            </p>
          ) : null}
          <Attachments urls={dispute.evidenceUrls} />
          <time>{new Date(dispute.createdAt).toLocaleString()}</time>
        </div>
      </li>
      {dispute.messages.map((m) =>
        m.authorRole === 'SYSTEM' ? (
          <li key={m.id} className={styles.system}>
            <p>{m.body}</p>
            <time>{new Date(m.createdAt).toLocaleString()}</time>
          </li>
        ) : (
          <li key={m.id} className={m.mine ? styles.mine : styles.theirs} data-role={m.authorRole}>
            <div className={styles.bubble}>
              <div className={styles.author}>
                <strong>{m.mine ? 'You' : m.authorName || ROLE_LABEL[m.authorRole]}</strong>
                <span className={styles.roleChip} data-role={m.authorRole}>
                  {ROLE_LABEL[m.authorRole]}
                </span>
              </div>
              <p className={styles.body}>{m.body}</p>
              <Attachments urls={m.attachments} />
              <time>{new Date(m.createdAt).toLocaleString()}</time>
            </div>
          </li>
        ),
      )}
    </ol>
  );
}

function Composer({ dispute }: { dispute: DisputeDetail }) {
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const send = usePostDisputeMessage();
  const upload = useUploadDisputeEvidence();

  const placeholder =
    dispute.viewer.role === 'SELLER'
      ? 'Reply to the customer, e.g. new delivery date or tracking details…'
      : dispute.viewer.role === 'ADMIN'
        ? 'Message both parties as NeereMarket support…'
        : 'Add details, answer questions, or share an update…';

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    try {
      const uploaded = await upload.mutateAsync(Array.from(files).slice(0, 6 - attachments.length));
      setAttachments((prev) => [...prev, ...uploaded.map((f) => f.url)].slice(0, 6));
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setErr(null);
    try {
      await send.mutateAsync({ id: dispute.id, body: body.trim(), attachments });
      setBody('');
      setAttachments([]);
    } catch (e2) {
      setErr(getErrorMessage(e2));
    }
  }

  return (
    <form className={styles.composer} onSubmit={onSubmit}>
      {err ? <Alert tone="error">{err}</Alert> : null}
      <label className={styles.srOnly} htmlFor="dispute-reply">
        Your message
      </label>
      <textarea
        id="dispute-reply"
        rows={2}
        value={body}
        maxLength={4000}
        placeholder={placeholder}
        onChange={(e) => setBody(e.target.value)}
      />
      {attachments.length ? (
        <ul className={styles.pending}>
          {attachments.map((url) => (
            <li key={url}>
              <span>{url.split('/').pop()}</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setAttachments((prev) => prev.filter((u) => u !== url))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.composerBar}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          className={styles.srOnly}
          id="dispute-attach"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={styles.composerBtn}
          disabled={upload.isPending || attachments.length >= 6}
          onClick={() => fileRef.current?.click()}
        >
          {upload.isPending ? 'Uploading…' : 'Attach photos'}
        </Button>
        <Button
          type="submit"
          size="sm"
          className={`${styles.composerBtn} ${styles.sendBtn}`}
          disabled={send.isPending || !body.trim()}
        >
          {send.isPending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </form>
  );
}

function Actions({ dispute }: { dispute: DisputeDetail }) {
  const withdraw = useWithdrawDispute();
  const confirm = useConfirm();
  const toast = useToast();
  const [err, setErr] = useState<string | null>(null);

  if (!dispute.viewer.canWithdraw) return null;

  async function onWithdraw() {
    const ok = await confirm({
      title: 'Close dispute',
      message: 'Close this dispute? Do this only if the problem has been sorted out with the seller.',
      confirmText: 'Yes, close dispute',
      tone: 'info',
    });
    if (!ok) return;

    setErr(null);
    try {
      await withdraw.mutateAsync({ id: dispute.id, reason: 'Issue sorted with the seller' });
      toast.success('Dispute closed successfully.');
    } catch (e) {
      const msg = getErrorMessage(e);
      setErr(msg);
      toast.error(msg);
    }
  }

  return (
    <section className={styles.card} data-slot="actions">
      <h3>Sorted it out with the seller?</h3>
      {err ? <Alert tone="error">{err}</Alert> : null}
      <p className={styles.muted}>
        Close the dispute once you are happy. Otherwise NeereMarket support will review the
        conversation and decide a fair outcome.
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className={styles.fullBtn}
        disabled={withdraw.isPending}
        onClick={() => void onWithdraw()}
      >
        Problem solved, close dispute
      </Button>
    </section>
  );
}

function Decision({ dispute }: { dispute: DisputeDetail }) {
  return (
    <section
      className={styles.card}
      data-slot="decision"
      data-tone={dispute.status === 'RESOLVED' ? 'ok' : 'danger'}
    >
      <h3>NeereMarket decision</h3>
      <dl className={styles.dl}>
        <div>
          <dt>Outcome</dt>
          <dd>{resolutionLabel(dispute.resolution)}</dd>
        </div>
        {dispute.refundAmount ? (
          <div>
            <dt>Refund</dt>
            <dd>{formatRwf(dispute.refundAmount)}</dd>
          </div>
        ) : null}
        {dispute.resolvedAt ? (
          <div>
            <dt>Decided</dt>
            <dd>{new Date(dispute.resolvedAt).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>
      {dispute.resolutionNote ? <p className={styles.note}>{dispute.resolutionNote}</p> : null}
    </section>
  );
}

const REFUND_RESOLUTIONS: DisputeResolution[] = ['FULL_REFUND', 'PARTIAL_REFUND', 'RETURN_AND_REFUND'];

function ResolvePanel({ dispute }: { dispute: DisputeDetail }) {
  const resolve = useResolveDispute();
  const [outcome, setOutcome] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [resolution, setResolution] = useState<DisputeResolution>(
    dispute.desiredOutcome && dispute.desiredOutcome !== 'NO_ACTION' ? dispute.desiredOutcome : 'REDELIVERY',
  );
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const parcelTotal = Number(dispute.sellerOrder.subtotal) + Number(dispute.sellerOrder.deliveryFee);
  const needsAmount = outcome === 'RESOLVED' && REFUND_RESOLUTIONS.includes(resolution);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const refundAmount = needsAmount && amount ? Math.round(Number(amount)) : undefined;
    if (refundAmount !== undefined && (!Number.isFinite(refundAmount) || refundAmount <= 0)) {
      setErr('Enter a valid refund amount');
      return;
    }
    try {
      await resolve.mutateAsync({
        id: dispute.id,
        outcome,
        resolution: outcome === 'REJECTED' ? 'NO_ACTION' : resolution,
        note: note.trim(),
        refundAmount,
      });
    } catch (e2) {
      setErr(getErrorMessage(e2));
    }
  }

  return (
    <section className={styles.card} data-slot="resolve" data-tone="brand">
      <h3>Record a decision</h3>
      {err ? <Alert tone="error">{err}</Alert> : null}
      <form className={styles.stackForm} onSubmit={onSubmit}>
        <div className={styles.segmented} role="radiogroup" aria-label="Outcome">
          <button
            type="button"
            role="radio"
            aria-checked={outcome === 'RESOLVED'}
            data-on={outcome === 'RESOLVED' || undefined}
            onClick={() => setOutcome('RESOLVED')}
          >
            Resolve
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={outcome === 'REJECTED'}
            data-on={outcome === 'REJECTED' || undefined}
            onClick={() => setOutcome('REJECTED')}
          >
            Reject claim
          </button>
        </div>
        {outcome === 'RESOLVED' ? (
          <label className={styles.field}>
            <span>Resolution</span>
            <select value={resolution} onChange={(e) => setResolution(e.target.value as DisputeResolution)}>
              {RESOLUTION_OPTIONS.filter((o) => o.value !== 'NO_ACTION').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {needsAmount ? (
          <label className={styles.field}>
            <span>
              Refund amount (RWF){resolution === 'PARTIAL_REFUND' ? '' : ' — leave empty for full parcel'}
            </span>
            <input
              type="number"
              min={1}
              max={parcelTotal}
              inputMode="numeric"
              value={amount}
              required={resolution === 'PARTIAL_REFUND'}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(parcelTotal)}
            />
          </label>
        ) : null}
        <label className={styles.field}>
          <span>Decision note (shared with both sides)</span>
          <textarea
            rows={3}
            value={note}
            minLength={3}
            maxLength={2000}
            required
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the decision and what each side must do next"
          />
        </label>
        {needsAmount ? (
          <p className={styles.muted}>
            This records the refund decision and notifies both sides. Send the money from Finance.
          </p>
        ) : null}
        <Button
          type="submit"
          size="sm"
          className={styles.fullBtn}
          disabled={resolve.isPending || note.trim().length < 3}
        >
          {resolve.isPending ? 'Saving…' : outcome === 'RESOLVED' ? 'Resolve dispute' : 'Reject and close'}
        </Button>
      </form>
    </section>
  );
}

function ParcelCard({ dispute }: { dispute: DisputeDetail }) {
  const so = dispute.sellerOrder;
  return (
    <section className={styles.card}>
      <h3>Parcel {so.sellerOrderNumber}</h3>
      <p className={styles.row}>
        <Badge tone={statusTone(so.status)}>{prettyStatus(so.status)}</Badge>
        <span className={styles.muted}>Order {prettyStatus(dispute.order.status).toLowerCase()}</span>
      </p>
      <ul className={styles.items}>
        {so.items.map((item) => (
          <li key={item.id}>
            <span>
              {item.productName}
              {item.variantName ? <small> · {item.variantName}</small> : null} × {item.quantity}
            </span>
            <strong>{formatRwf(item.lineTotal)}</strong>
          </li>
        ))}
      </ul>
      <p className={styles.total}>
        <span>Parcel total</span>
        <strong>{formatRwf(String(Number(so.subtotal) + Number(so.deliveryFee)))}</strong>
      </p>
    </section>
  );
}

function PartiesCard({ dispute }: { dispute: DisputeDetail }) {
  const role = dispute.viewer.role;
  return (
    <section className={styles.card}>
      <h3>People involved</h3>
      <dl className={styles.dl}>
        <div>
          <dt>Customer</dt>
          <dd>
            {role === 'CUSTOMER' ? 'You' : dispute.customer.fullName}
            {role === 'ADMIN' && (dispute.customer.email || dispute.customer.phone) ? (
              <small>{dispute.customer.email || dispute.customer.phone}</small>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Seller</dt>
          <dd>
            {role === 'SELLER' ? 'You' : dispute.seller.businessName}
            {role === 'ADMIN' && dispute.seller.businessPhone ? (
              <small>{dispute.seller.businessPhone}</small>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Mediator</dt>
          <dd>
            {dispute.resolvedBy?.fullName || 'NeereMarket support'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
