# Tombora Hub — Domain Lifecycles & State Machines

All transitions are enforced in backend services. Invalid transitions return `INVALID_STATE_TRANSITION`.

---

## 1. Seller lifecycle

```text
Registration (FREE)
       │
       ▼
 seller_profiles created
 verification_status = PENDING
       │
       ▼
 UNDER_REVIEW  ◄── admin opens application
       │
       ├──► VERIFIED
       └──► REJECTED (reason required)

 VERIFIED ──► SUSPENDED (admin + audit reason)
 SUSPENDED ──► VERIFIED (reinstate) | remains SUSPENDED
```

KYC fields (national ID, business reg, tax, payout details) are nullable until verification phase is enabled in settings.

---

## 2. Product lifecycle

```text
DRAFT ──► PENDING_APPROVAL ──► ACTIVE
                      │
                      └──► REJECTED ──► DRAFT (edit & resubmit)

ACTIVE ──► OUT_OF_STOCK (inventory hit 0)
ACTIVE ──► SUSPENDED (admin/policy)
ACTIVE ──► ARCHIVED (seller)

OUT_OF_STOCK ──► ACTIVE (restock)
SUSPENDED ──► ACTIVE | REJECTED | ARCHIVED
```

If `settings.product_auto_approve = true`, skip PENDING_APPROVAL → ACTIVE.

---

## 3. Order lifecycle (parent order)

```text
PENDING_PAYMENT
       │ payment webhook PAID
       ▼
PAID → CONFIRMED → PROCESSING → READY_FOR_SHIPMENT
       → SHIPPED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED

Any pre-ship: → CANCELLED (policy-dependent)
DELIVERED/COMPLETED: → RETURN_REQUESTED → …
Any: → DISPUTED (support)
Refund path: → REFUND_PENDING → REFUNDED
```

### Seller order

Mirrors fulfillment states for that seller’s slice only. Parent aggregates: e.g. parent SHIPPED when all seller orders ≥ SHIPPED (configurable).

### Allowed transition map (abbreviated)

| From | To |
|------|-----|
| PENDING_PAYMENT | PAID, CANCELLED, EXPIRED* |
| PAID | CONFIRMED, CANCELLED, REFUND_PENDING |
| CONFIRMED | PROCESSING, CANCELLED |
| PROCESSING | READY_FOR_SHIPMENT, CANCELLED |
| READY_FOR_SHIPMENT | SHIPPED, CANCELLED |
| SHIPPED | OUT_FOR_DELIVERY, DELIVERED |
| OUT_FOR_DELIVERY | DELIVERED |
| DELIVERED | COMPLETED, RETURN_REQUESTED |
| RETURN_REQUESTED | RETURNED, REFUND_PENDING, CANCELLED(return) |
| REFUND_PENDING | REFUNDED |
| * | DISPUTED from most non-terminal states |

\* payment expiry job

---

## 4. Payment lifecycle

```text
INITIATED → PENDING → AUTHORIZED → PAID
                 ↘ FAILED | CANCELLED | EXPIRED
PAID → REFUNDED | PARTIALLY_REFUNDED
```

Rules:
- Status changes only from provider webhook/reconcile jobs after signature verification.
- `idempotency_key` unique per payment create.
- `payment_webhooks.payload_hash` unique — duplicate webhooks no-op.

---

## 5. Commission lifecycle

```text
Order item eligible (COMPLETED or settle event per settings)
       ▼
CommissionEngine.resolveRule(product, category, seller, promotion)
  precedence: PRODUCT > SELLER > CATEGORY > PROMOTION > GLOBAL
       ▼
Compute: percentage (bps) and/or fixed
       ▼
In one DB transaction:
  - commission_transactions row
  - seller_ledger SALE (gross)
  - seller_ledger COMMISSION (platform cut, negative to seller)
  - update seller_wallets.pending_balance
       ▼
After hold period → move pending → available (ledger AVAILABLE_RELEASE)
```

Never compute commission ad-hoc in random controllers.

---

## 6. Return & refund lifecycle

```text
REQUESTED → UNDER_REVIEW → APPROVED | REJECTED
APPROVED → PICKUP_REQUIRED → RECEIVED → INSPECTED
INSPECTED → REFUND_PENDING → REFUNDED → CLOSED
```

`return_window_days` from settings (default 7). Verified against `delivered_at`.

Refund recalculates commission clawback via ledger REFUND entries (immutable).

---

## 7. Payout lifecycle

```text
REQUESTED → UNDER_REVIEW → APPROVED → PROCESSING → PAID
                              ↘ CANCELLED
                         PROCESSING → FAILED
```

Guards:
- amount ≤ available_balance
- no overlapping duplicate payout for same funds (row locks)
- ledger PAYOUT entry + wallet decrement in same transaction
- admin actions audit-logged

---

## 8. Inventory reservation (checkout)

```text
BEGIN
  SELECT inventory FOR UPDATE
  available = quantity - reserved
  if available < qty → abort INSUFFICIENT_STOCK
  reserved += qty
  inventory_movements RESERVE
COMMIT

On payment success: quantity -= qty; reserved -= qty; movement COMMIT_SALE
On payment fail/expire: reserved -= qty; movement RELEASE
```

Prevents oversell and race conditions.

---

## 9. Multi-vendor checkout sequence

```text
Cart validate
  → create checkout session
  → reserve stock per variant
  → create Payment INITIATED/PENDING (provider)
  → customer completes MoMo/Airtel
  → webhook → verify → PAID
  → create parent order + seller_orders + items
  → commit reservations
  → notify sellers/customer
```

Customer UX: one checkout, one parent order id.  
Seller UX: only `ORD-xxxxx-S{n}`.  
Admin UX: full tree.
