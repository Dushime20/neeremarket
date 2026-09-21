# Tombora Hub — PostgreSQL ERD & Table Spec

## Entity relationship (text ERD)

```text
┌──────────┐     ┌────────────┐     ┌─────────────┐
│  users   │────<│ user_roles │>────│    roles    │
└────┬─────┘     └────────────┘     └──────┬──────┘
     │                                      │
     │                               ┌──────┴──────────┐
     │                               │ role_permissions│
     │                               └──────┬──────────┘
     │                                      │
     │                               ┌──────┴──────────┐
     │                               │  permissions    │
     │                               └─────────────────┘
     │
     ├────< addresses
     ├────< carts ────< cart_items
     ├────< wishlists ────< wishlist_items
     ├────< orders (as customer)
     │
     └──── seller_profiles ──── stores
              │                    │
              ├─ seller_verifications
              ├─ seller_wallets
              ├─ seller_ledger
              └─ payout_requests

categories (tree) ──< products ──< product_variants ── inventory
       │                 │                │
       │                 ├─ product_images│
       │                 ├─ product_videos│
       │                 └─ brands        └─ inventory_movements
       │
orders ──< seller_orders ──< order_items
  │              │
  ├─ payments ── payment_transactions
  │           └─ payment_webhooks
  ├─ deliveries
  ├─ order_status_history
  └─ returns ── return_items ── refunds

commission_rules ──> commission_transactions ──> seller_ledger
reviews, messages, notifications, coupons, promotions
audit_logs, fraud_events, analytics_events, settings, cms_*
```

## Indexing strategy (high frequency)

| Area | Indexes |
|------|---------|
| Products | `(slug)`, `(status, created_at DESC)`, `(category_id)`, `(store_id)`, GIN/trigram on name for search |
| Orders | `(customer_id, created_at)`, `(order_number)`, seller_orders `(seller_id, status)` |
| Payments | `(idempotency_key UNIQUE)`, `(provider_ref)` |
| Inventory | `(variant_id UNIQUE)` |
| Ledger | `(seller_id, created_at)`, `(entry_type)` |
| Audit | `(actor_id, created_at)`, `(entity_type, entity_id)` |

## Money handling

- Store amounts as **integer RWF** (no floats) or `DECIMAL(18,2)` with currency code.
- Recommendation: **integer minor units** — for RWF, 1 unit = 1 RWF (no cents), still use bigint.
- Always snapshot unit price and commission at order-item time.

## Soft delete

`users`, `products`, `stores`, `reviews` — `deleted_at`.  
Financial tables: **no physical delete**.

## Search evolution

v1: PostgreSQL `ILIKE` / `tsvector` on products.  
v2: outbox event `ProductIndexed` → OpenSearch without changing product domain tables.
