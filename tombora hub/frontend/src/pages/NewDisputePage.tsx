import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useCreateDispute,
  useMe,
  useMyDisputes,
  useOrder,
  useOrders,
  useUploadDisputeEvidence,
  type DisputeResolution,
  type DisputeType,
} from '@/api/hooks';
import { getErrorMessage } from '@/api/client';
import { Alert, Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { pageTitle } from '@/config/brand';
import { loginHref } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import { DISPUTE_TYPE_OPTIONS, RESOLUTION_OPTIONS, isDisputeActive } from '@/utils/disputes';
import styles from './DisputesPage.module.css';

type Parcel = {
  id: string;
  sellerOrderNumber: string;
  sellerName: string;
  status: string;
  subtotal: string;
  items: Array<{ productName: string; quantity: number }>;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  sellerOrders?: Array<{ sellerOrderNumber: string; sellerName: string }>;
};

const ORDERS_PREVIEW = 4;

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function scrollToOnMobile(ref: RefObject<HTMLElement | null>) {
  if (!window.matchMedia('(max-width: 760px)').matches) return;
  window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}

export function NewDisputePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: user, isLoading: userLoading } = useMe();
  const { data: orders, isLoading: ordersLoading } = useOrders(!!user);
  const { data: myDisputes } = useMyDisputes(undefined, !!user);

  const [orderId, setOrderId] = useState(params.get('orderId') || '');
  const [sellerOrderId, setSellerOrderId] = useState(params.get('sellerOrderId') || '');
  const [type, setType] = useState<DisputeType | ''>('');
  const [subject, setSubject] = useState('');
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState<DisputeResolution | ''>('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typeStepRef = useRef<HTMLFieldSetElement>(null);
  const detailStepRef = useRef<HTMLFieldSetElement>(null);

  const { data: order, isLoading: orderLoading } = useOrder(orderId);
  const create = useCreateDispute();
  const upload = useUploadDisputeEvidence();

  const parcels = useMemo(() => (order?.sellerOrders || []) as Parcel[], [order]);
  const selectedParcel = parcels.find((p) => p.id === sellerOrderId);
  const orderStatus = String(order?.status || '');

  useEffect(() => {
    if (parcels.length === 1 && !sellerOrderId) setSellerOrderId(parcels[0].id);
  }, [parcels, sellerOrderId]);

  useEffect(() => {
    if (orderStatus === 'PENDING_PAYMENT' && type && type !== 'PAYMENT_ISSUE') setType('');
  }, [orderStatus, type]);

  useEffect(() => {
    if (!type || subjectTouched) return;
    const option = DISPUTE_TYPE_OPTIONS.find((o) => o.value === type);
    setSubject(option ? `${option.label}${selectedParcel ? ` – ${selectedParcel.sellerName}` : ''}` : '');
  }, [type, selectedParcel, subjectTouched]);

  const existing = selectedParcel
    ? (myDisputes || []).find(
        (d) => d.sellerOrderNumber === selectedParcel.sellerOrderNumber && isDisputeActive(d.status),
      )
    : undefined;

  if (!userLoading && !user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in to open a dispute"
          actionLabel="Log in"
          onAction={() => navigate(loginHref(`/disputes/new${window.location.search}`))}
        />
      </div>
    );
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    try {
      const uploaded = await upload.mutateAsync(Array.from(files).slice(0, 8 - evidence.length));
      setEvidence((prev) => [...prev, ...uploaded.map((f) => f.url)].slice(0, 8));
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orderId || !sellerOrderId || !type) {
      setErr('Choose the order, the parcel, and what went wrong.');
      return;
    }
    setErr(null);
    try {
      const dispute = await create.mutateAsync({
        orderId,
        sellerOrderId,
        type,
        subject: subject.trim(),
        description: description.trim(),
        desiredOutcome: desiredOutcome || undefined,
        evidenceUrls: evidence,
      });
      navigate(`/disputes/${dispute.id}`, { replace: true });
    } catch (e2) {
      setErr(getErrorMessage(e2));
    }
  }

  function pickOrder(id: string) {
    setOrderId(id);
    setSellerOrderId('');
  }

  function pickParcel(id: string) {
    setSellerOrderId(id);
    scrollToOnMobile(typeStepRef);
  }

  function pickType(value: DisputeType) {
    setType(value);
    scrollToOnMobile(detailStepRef);
  }

  const unpaid = orderStatus === 'PENDING_PAYMENT';
  const typeOptions = unpaid
    ? DISPUTE_TYPE_OPTIONS.filter((o) => o.value === 'PAYMENT_ISSUE')
    : DISPUTE_TYPE_OPTIONS;

  const missing = !orderId
    ? 'Choose an order'
    : !selectedParcel
      ? 'Choose the seller parcel'
      : existing
        ? 'A dispute is already open for this parcel'
        : !type
          ? 'Choose what went wrong'
          : subject.trim().length < 4
            ? 'Add a short title'
            : description.trim().length < 10
              ? 'Describe what happened (10+ characters)'
              : null;

  return (
    <div className={`container ${styles.page} ${styles.formPage}`}>
      <Helmet>
        <title>{pageTitle('Open a dispute')}</title>
      </Helmet>
      <Link to="/disputes" className={styles.back}>
        ← Resolution center
      </Link>
      <header className={styles.formHead}>
        <h1>Open a dispute</h1>
        <p>
          Your dispute goes to the seller and to NeereMarket support at the same time. You talk with
          the seller in the dispute, and support steps in to decide if you can't agree.
        </p>
      </header>

      <form className={styles.form} onSubmit={onSubmit}>
        <fieldset className={styles.step}>
          <legend>
            <span>1</span> Which order?
          </legend>
          {ordersLoading ? (
            <>
              <Skeleton height={64} />
              <Skeleton height={64} />
            </>
          ) : !orders?.items.length ? (
            <p className={styles.muted}>
              You have no orders yet. Disputes can only be opened for orders you placed.
            </p>
          ) : (
            <OrderPicker orders={orders.items} value={orderId} onChange={pickOrder} />
          )}

          {orderId ? (
            orderLoading ? (
              <Skeleton height={64} />
            ) : parcels.length > 1 ? (
              <div className={styles.field}>
                <span>Which seller's parcel has the problem?</span>
                <div className={styles.choiceList} role="radiogroup">
                  {parcels.map((p) => (
                    <label key={p.id} className={styles.choice} data-on={sellerOrderId === p.id || undefined}>
                      <input
                        type="radio"
                        name="parcel"
                        value={p.id}
                        checked={sellerOrderId === p.id}
                        onChange={() => pickParcel(p.id)}
                      />
                      <span>
                        <strong>{p.sellerName}</strong>
                        <small>
                          {p.sellerOrderNumber} · {prettyStatus(p.status).toLowerCase()}
                        </small>
                        <small>{p.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : selectedParcel ? (
              <p className={styles.parcelNote}>
                Seller: <strong>{selectedParcel.sellerName}</strong> · {selectedParcel.sellerOrderNumber}
              </p>
            ) : null
          ) : null}

          {existing ? (
            <div className={styles.warn}>
              <p>
                You already have an active dispute for this parcel ({existing.disputeNumber}). Add
                new details there instead.
              </p>
              <Link to={`/disputes/${existing.id}`}>
                <Button type="button" size="sm" variant="secondary">
                  Open {existing.disputeNumber}
                </Button>
              </Link>
            </div>
          ) : null}
        </fieldset>

        <fieldset ref={typeStepRef} className={styles.step} disabled={!selectedParcel || !!existing}>
          <legend>
            <span>2</span> What went wrong?
          </legend>
          {unpaid ? (
            <p className={styles.muted}>
              This order is not paid yet, so only payment problems can be reported.
            </p>
          ) : null}
          <div className={styles.typeGrid} role="radiogroup">
            {typeOptions.map((o) => (
              <label key={o.value} className={styles.choice} data-on={type === o.value || undefined}>
                <input
                  type="radio"
                  name="type"
                  value={o.value}
                  checked={type === o.value}
                  onChange={() => pickType(o.value)}
                />
                <span>
                  <strong>{o.label}</strong>
                  <small>{o.hint}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset
          ref={detailStepRef}
          className={styles.step}
          disabled={!selectedParcel || !type || !!existing}
        >
          <legend>
            <span>3</span> Tell us the details
          </legend>
          <label className={styles.field}>
            <span>Short title</span>
            <input
              value={subject}
              required
              minLength={4}
              maxLength={140}
              enterKeyHint="next"
              onChange={(e) => {
                setSubject(e.target.value);
                setSubjectTouched(true);
              }}
            />
          </label>
          <label className={styles.field}>
            <span>What happened?</span>
            <textarea
              rows={5}
              required
              minLength={10}
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'SHIPPING_DELAY'
                  ? 'e.g. Seller promised delivery on Monday. It is now Thursday and the order still shows "processing".'
                  : 'Describe the problem, including dates and anything the seller told you.'
              }
            />
          </label>
          <div className={styles.field}>
            <span>How would you like it solved? (optional)</span>
            <div className={styles.pills} role="radiogroup" aria-label="Preferred outcome">
              {[{ value: '' as const, label: 'Let the seller propose' }, ...RESOLUTION_OPTIONS.filter((o) => o.value !== 'NO_ACTION')].map(
                (o) => (
                  <button
                    key={o.value || 'none'}
                    type="button"
                    role="radio"
                    aria-checked={desiredOutcome === o.value}
                    data-on={desiredOutcome === o.value || undefined}
                    onClick={() => setDesiredOutcome(o.value)}
                  >
                    {o.label}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className={styles.field}>
            <span>Photos or video (optional, up to 8)</span>
            <div className={styles.evidenceRow}>
              {evidence.map((url) => (
                <div key={url} className={styles.evidenceThumb}>
                  {/\.(mp4|webm|mov)$/i.test(url) ? <span>Video</span> : <img src={url} alt="Evidence" />}
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={() => setEvidence((prev) => prev.filter((u) => u !== url))}
                  >
                    ×
                  </button>
                </div>
              ))}
              {evidence.length < 8 ? (
                <button
                  type="button"
                  className={styles.addEvidence}
                  disabled={upload.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  <CameraIcon />
                  <span>{upload.isPending ? 'Uploading…' : 'Add photo'}</span>
                </button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              multiple
              hidden
              onChange={(e) => void onFiles(e.target.files)}
            />
          </div>
        </fieldset>

        {err ? <Alert tone="error">{err}</Alert> : null}

        <div className={styles.submitBar}>
          <p className={styles.submitHint} aria-live="polite">
            {missing || 'Ready to send to the seller and NeereMarket support'}
          </p>
          <div className={styles.submitActions}>
            <Link to="/disputes" className={styles.cancelLink}>
              Cancel
            </Link>
            <Button type="submit" disabled={create.isPending || !!missing || upload.isPending}>
              {create.isPending ? 'Submitting…' : 'Submit dispute'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function OrderPicker({
  orders,
  value,
  onChange,
}: {
  orders: OrderRow[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [changing, setChanging] = useState(!value);
  const [showAll, setShowAll] = useState(false);
  const selected = orders.find((o) => o.id === value);

  useEffect(() => {
    if (!value) setChanging(true);
  }, [value]);

  if (selected && !changing) {
    return (
      <div className={styles.selectedOrder}>
        <OrderCardBody order={selected} />
        <button type="button" className={styles.changeBtn} onClick={() => setChanging(true)}>
          Change
        </button>
      </div>
    );
  }

  const visible = showAll ? orders : orders.slice(0, ORDERS_PREVIEW);
  return (
    <div className={styles.choiceList} role="radiogroup" aria-label="Your orders">
      {visible.map((o) => (
        <label key={o.id} className={`${styles.choice} ${styles.orderChoice}`} data-on={value === o.id || undefined}>
          <input
            type="radio"
            name="order"
            value={o.id}
            checked={value === o.id}
            onChange={() => {
              onChange(o.id);
              setChanging(false);
            }}
          />
          <OrderCardBody order={o} />
        </label>
      ))}
      {orders.length > ORDERS_PREVIEW ? (
        <button type="button" className={styles.moreBtn} onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer orders' : `Show all ${orders.length} orders`}
        </button>
      ) : null}
    </div>
  );
}

function OrderCardBody({ order }: { order: OrderRow }) {
  const sellers = (order.sellerOrders || []).map((s) => s.sellerName).filter(Boolean);
  return (
    <span className={styles.orderBody}>
      <span className={styles.orderTop}>
        <strong>{order.orderNumber}</strong>
        <span className={styles.orderTotal}>{formatRwf(order.total)}</span>
      </span>
      <span className={styles.orderBottom}>
        <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
        <small>
          {shortDate(order.createdAt)}
          {sellers.length ? ` · ${sellers.join(', ')}` : ''}
        </small>
      </span>
    </span>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <path
        d="M4 8h3l1.5-2h7L17 8h3v11H4V8zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
