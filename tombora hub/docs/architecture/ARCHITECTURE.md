# Tombora Hub — System Architecture

**Product:** Multi-vendor e-commerce marketplace for Rwanda  
**Codename:** Tombora Hub  
**Architecture style:** Modular monolith (API-first)  
**Primary currency:** RWF (extensible)  
**Revenue model:** Configurable commission on completed sales (no seller subscription in v1)

> This document is the Phase 1 deliverable. Implementation follows phases 2–8 without skipping foundations.

---

## 1. Complete System Architecture

```
                         ┌─────────────────────────────────────┐
                         │              Clients                │
                         │  Mobile Web │ Desktop │ (Future App)│
                         └─────────────────┬───────────────────┘
                                           │ HTTPS
                         ┌─────────────────▼───────────────────┐
                         │              Nginx                  │
                         │   TLS │ reverse proxy │ static │ CDN│
                         └─────────┬───────────────┬───────────┘
                                   │               │
                    ┌──────────────▼──┐   ┌────────▼──────────┐
                    │  Frontend SPA   │   │  Backend API      │
                    │  React + Vite   │   │  Node/Express     │
                    │  TanStack Query │   │  Modular Monolith │
                    │  Axios          │   │  /api/v1/*        │
                    └─────────────────┘   └────────┬──────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
           ┌────────▼────────┐          ┌─────────▼─────────┐         ┌──────────▼─────────┐
           │   PostgreSQL    │          │      Redis        │         │  Object Storage    │
           │  Source of truth│          │ cache/sessions/RL │         │ local → S3-compat  │
           └─────────────────┘          └───────────────────┘         └────────────────────┘
                    │
           ┌────────▼────────┐
           │  Worker (Bull)  │  notifications, webhooks retry, payouts, search index
           └─────────────────┘
```

### Domain modules (modular monolith)

| Module | Responsibility |
|--------|----------------|
| `auth` | Login, tokens, OTP-ready, password reset, lockout |
| `users` | Profiles, addresses, account settings |
| `rbac` | Roles, permissions, grants |
| `sellers` | Onboarding, verification, trust metrics |
| `stores` | Public storefronts |
| `catalog` | Categories, brands, products, variants, SEO |
| `inventory` | Stock, reservations, movements, audit |
| `cart` | Multi-vendor cart |
| `checkout` | Address, delivery, payment initiation |
| `orders` | Parent + seller orders, state machine |
| `payments` | Provider abstraction, webhooks, idempotency |
| `refunds` / `returns` | Return windows, refund reconciliation |
| `commissions` | Rule engine + ledger postings |
| `wallet` / `ledger` / `payouts` | Seller balances, immutable ledger, payouts |
| `delivery` | Zones, fees, DeliveryProvider abstraction |
| `reviews` | Product/seller reviews, verified purchase |
| `wishlist` | Lists + price/restock events |
| `promotions` | Coupons, campaigns |
| `notifications` | In-app, email, SMS, WhatsApp-ready |
| `messaging` | Customer ↔ seller threads |
| `disputes` / `fraud` | Risk score, events |
| `analytics` | Event tracking, dashboards |
| `admin` / `cms` / `audit` / `settings` | Ops, content, audit trail |

Modules communicate via **in-process domain events** (e.g. `PaymentCompleted` → commission, notify, analytics). Financial mutations always run inside DB transactions.

---

## 2. Recommended Technology Stack

### Frontend
| Concern | Choice |
|---------|--------|
| UI | React 18 + TypeScript + Vite |
| Data fetching | TanStack Query (React Query) |
| HTTP | Axios (interceptors for auth/errors) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Styling | CSS Modules + design tokens (custom Rwanda-first system) |
| Charts | Recharts |
| Tables | TanStack Table |
| i18n-ready | react-i18next (EN/RW later) |
| SEO | react-helmet-async + SSR-ready meta (future Next optional) |

### Backend
| Concern | Choice |
|---------|--------|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 + TypeScript |
| Validation | Zod |
| ORM | Prisma (migrations, type safety) |
| Auth | JWT access + refresh, bcrypt/argon2 |
| Jobs | BullMQ + Redis |
| Docs | OpenAPI via swagger-jsdoc / zod-to-openapi |
| Logging | pino (structured JSON) |
| Rate limit | express-rate-limit + Redis store |
| Tests | Vitest + Supertest |

### Infrastructure
| Concern | Choice |
|---------|--------|
| DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Containers | Docker + Compose |
| Proxy | Nginx |
| Storage | Local (dev) / S3-compatible (prod) |

**Not microservices in v1** — extract later if volume demands it.

---

## 3. Folder Structure

```text
tombora-hub/
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md          ← this file
│   │   ├── ERD.md
│   │   └── LIFECYCLES.md
│   └── api/
│       └── openapi.yaml             ← generated/maintained
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── shared/                  # errors, logger, middleware, utils
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── rbac/
│   │   │   ├── sellers/
│   │   │   ├── stores/
│   │   │   ├── catalog/
│   │   │   ├── inventory/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── commissions/
│   │   │   ├── wallet/
│   │   │   ├── payouts/
│   │   │   ├── delivery/
│   │   │   ├── returns/
│   │   │   ├── reviews/
│   │   │   ├── wishlist/
│   │   │   ├── promotions/
│   │   │   ├── notifications/
│   │   │   ├── messaging/
│   │   │   ├── fraud/
│   │   │   ├── analytics/
│   │   │   ├── admin/
│   │   │   ├── cms/
│   │   │   ├── audit/
│   │   │   └── settings/
│   │   ├── events/                  # domain event bus
│   │   ├── jobs/
│   │   └── providers/               # PaymentProvider, DeliveryProvider, StorageProvider
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── api/                     # axios clients + React Query hooks
│   │   ├── components/              # design system
│   │   ├── features/                # marketplace, seller, admin
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── utils/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
├── nginx/
│   └── nginx.conf
├── scripts/
│   ├── backup-postgres.sh
│   └── restore-postgres.sh
├── docker-compose.yml
├── docker-compose.production.yml
├── .env.example
└── README.md
```

Each backend module pattern:

```text
modules/<name>/
  <name>.routes.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.repository.ts
  <name>.schema.ts          # Zod
  <name>.events.ts
  <name>.types.ts
```

---

## 4. PostgreSQL ERD (Logical)

```text
users ──┬── user_roles ── roles ── role_permissions ── permissions
        ├── addresses
        ├── customer profile fields
        └── seller_profiles ── stores
                ├── seller_verifications
                ├── seller_wallets
                └── seller_ledger ◄── commission_transactions
                                     payout_requests

categories (self-ref) ── products ── product_variants ── inventory
                      │              product_images
                      │              product_attributes
                      └── brands

carts ── cart_items ──► variants

orders (parent) ── seller_orders ── order_items
                ├── order_status_history
                ├── payments ── payment_transactions
                │            └── payment_webhooks
                ├── deliveries
                ├── returns ── return_items ── refunds
                └── commissions posting → seller_ledger

reviews (product | seller)
wishlists ── wishlist_items
coupons / promotions
commission_rules
notifications / messages
audit_logs / fraud_events / analytics_events
settings / cms_*
```

Full column-level definitions: see `docs/architecture/ERD.md` and Prisma schema.

---

## 5. Database Table Definitions (Core)

### Identity & RBAC
- `users` — id (UUID), email, phone, password_hash, full_name, avatar_url, status, email_verified_at, phone_verified_at, failed_login_count, locked_until, created_at, updated_at, deleted_at
- `roles` — id, code (SUPER_ADMIN|ADMIN|…|CUSTOMER|SELLER), name
- `permissions` — id, code (orders.read, …), description
- `user_roles`, `role_permissions` — join tables with unique constraints

### Sellers & Stores
- `seller_profiles` — user_id, business_name, description, category, location hierarchy (province…village), market, shop, phones, whatsapp, logo, cover, verification_status, trust metrics JSON/columns
- `seller_verifications` — documents metadata, status history (KYC-ready)
- `stores` — slug (unique), seller_id, is_active, seo fields

### Catalog
- `categories` — parent_id, slug, name, image, sort_order, is_active
- `brands` — slug, name
- `products` — store_id, category_id, brand_id, sku, name, slug, descriptions, prices, currency (RWF), status, condition, weight, dimensions, SEO, soft delete
- `product_variants` — product_id, sku, attributes JSON, price, stock refs, weight
- `product_images` / `product_videos` — url, sort, is_primary
- `inventory` — variant_id UNIQUE, quantity, reserved, low_stock_threshold
- `inventory_movements` — type, delta, reason, ref_type, ref_id, actor_id (immutable audit)

### Commerce
- `carts`, `cart_items`
- `orders` — parent order number, customer_id, totals, currency, status
- `seller_orders` — order_id, seller_id, sub_order_number, status, totals
- `order_items` — seller_order_id, variant_id, qty, unit_price, commission snapshot fields
- `order_status_history` — from/to, actor, reason
- `addresses` — Rwanda hierarchy + KG/building/landmark/geo
- `deliveries` — method, provider, fee, tracking, status, ETA
- `delivery_zones` — fees by location rules

### Payments & Finance
- `payments` — order_id, provider, amount, status, idempotency_key UNIQUE
- `payment_transactions` — provider_ref, raw status, amounts
- `payment_webhooks` — payload hash UNIQUE, processed_at (idempotent)
- `commission_rules` — scope GLOBAL|CATEGORY|SELLER|PRODUCT|PROMOTION, rate_bps / fixed, precedence, dates
- `commission_transactions` — order_item_id, rule_id, amounts
- `seller_wallets` — seller_id, pending_balance, available_balance (controlled updates)
- `seller_ledger` — immutable entries: SALE, COMMISSION, REFUND, PAYOUT, …
- `payout_requests` / `payout_transactions`

### Engagement
- `reviews`, `review_images`, `wishlists`, `wishlist_items`
- `coupons`, `promotions`, `promotion_products`, `promotion_categories`
- `notifications`, `messages`, `message_attachments`
- `returns`, `return_items`, `refunds`, `disputes`
- `audit_logs`, `fraud_events`, `analytics_events`
- `settings` (key/value JSON), CMS tables (banners, pages, FAQs)

**Rules:** UUIDs PKs; FKs; unique constraints; check constraints (non-negative money/stock); indexes on slug, status, foreign keys, search columns; soft delete where history matters; **never hard-delete financial rows**.

---

## 6. RBAC Model

### Platform roles
| Role | Scope |
|------|--------|
| `SUPER_ADMIN` | Full access |
| `ADMIN` | Broad ops except destructive finance overrides (configurable) |
| `FINANCE_ADMIN` | payments, commissions, payouts, refunds |
| `SELLER_ADMIN` | seller approve/suspend/verify |
| `ORDER_ADMIN` | order ops, disputes |
| `CUSTOMER_SUPPORT` | read orders/users, limited updates |
| `CONTENT_ADMIN` | CMS, categories content |
| `MARKETING_ADMIN` | promotions, coupons |
| `SELLER` | seller dashboard APIs |
| `CUSTOMER` | shopper APIs |

### Permission codes (examples)
`orders.read`, `orders.update`, `payments.read`, `payments.refund`, `sellers.approve`, `sellers.suspend`, `products.approve`, `finance.read`, `payouts.approve`, `settings.update`, `audit.read`, `cms.update`

Authorization: middleware `requireAuth` → `requirePermission('payouts.approve')` → **object-level checks** in service (seller owns resource).

Frontend never trusted for permissions.

---

## 7–13. Lifecycles

Documented in detail in `docs/architecture/LIFECYCLES.md`. Summary:

### Seller lifecycle
`REGISTERED` → verification `PENDING` → `UNDER_REVIEW` → `VERIFIED` | `REJECTED` → optional `SUSPENDED`

### Product lifecycle
`DRAFT` → `PENDING_APPROVAL` → `ACTIVE` | `REJECTED` → `OUT_OF_STOCK` | `SUSPENDED` | `ARCHIVED`

### Order lifecycle (parent + mirrored seller_order subset)
`PENDING_PAYMENT` → `PAID` → `CONFIRMED` → `PROCESSING` → `READY_FOR_SHIPMENT` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED` → `COMPLETED`  
Branches: `CANCELLED`, `RETURN_*`, `REFUND_*`, `DISPUTED` — **only valid transitions allowed**

### Payment lifecycle
`INITIATED` → `PENDING` → `AUTHORIZED` → `PAID` | `FAILED` | `CANCELLED` | `EXPIRED` → `REFUNDED` | `PARTIALLY_REFUNDED`

### Commission lifecycle
Order completed (post return window or configured settle event) → Commission Engine resolves most-specific rule → ledger SALE + COMMISSION → seller pending → after hold → available

### Refund lifecycle
Return `REQUESTED` → … → `REFUND_PENDING` → payment provider refund → ledger adjustments → `REFUNDED`

### Payout lifecycle
`REQUESTED` → `UNDER_REVIEW` → `APPROVED` → `PROCESSING` → `PAID` | `FAILED` | `CANCELLED`

---

## 14. Multi-Vendor Checkout Flow

```text
1. Cart (items from N sellers)
2. Validate prices/stock server-side (ignore client prices)
3. Create Payment INTENT (PENDING) + reserve inventory (transaction)
4. Customer pays via MTN MoMo / Airtel Money (PaymentProvider)
5. Webhook verified → mark Payment PAID (idempotent)
6. Create Parent Order + N Seller Orders + Order Items (same txn as confirm)
7. Confirm inventory deduction from reserved
8. Emit OrderCreated / PaymentCompleted events
9. Sellers fulfill independently; customer sees one order timeline
10. On completion/settlement → Commission Engine → ledger
```

**Atomicity:** reservation + payment confirmation + order creation use DB transactions and idempotency keys. Frontend “success” never marks paid.

---

## 15. API Endpoint Specification (v1)

Base: `/api/v1`

### Auth
- `POST /auth/register` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout`
- `POST /auth/forgot-password` `POST /auth/reset-password`
- `POST /auth/verify-email` `POST /auth/verify-phone` (OTP-ready)

### Catalog (public)
- `GET /products` `GET /products/:slug` `GET /categories` `GET /categories/:slug`
- `GET /brands` `GET /search` `GET /stores` `GET /stores/:slug`

### Cart / Checkout / Orders
- `GET|POST|PATCH|DELETE /cart` `/cart/items`
- `POST /checkout/session` `POST /checkout/confirm`
- `GET /orders` `GET /orders/:id`

### Payments
- `POST /payments` `GET /payments/:id`
- `POST /payments/webhooks/:provider` (signature verified)

### Seller
- `POST /sellers/register` `GET/PATCH /sellers/me`
- `CRUD /sellers/me/products` `/inventory` `/orders` `/finance` `/payouts`

### Customer extras
- `/wishlist` `/reviews` `/returns` `/messages` `/notifications` `/addresses`

### Admin
- `/admin/users` `/admin/sellers` `/admin/products` `/admin/orders`
- `/admin/payments` `/admin/finance` `/admin/payouts` `/admin/commissions`
- `/admin/returns` `/admin/cms` `/admin/settings` `/admin/audit` `/admin/analytics`

Envelope:

```json
{ "success": true, "data": {}, "message": "…" }
{ "success": false, "error": { "code": "PRODUCT_OUT_OF_STOCK", "message": "…" } }
```

Full OpenAPI generated in Phase 2+.

---

## 16. Docker Architecture

**Dev (`docker-compose.yml`):** `frontend`, `backend`, `postgres`, `redis`, optional `worker`, `nginx`

**Prod (`docker-compose.production.yml`):** multi-stage builds, no Vite/dev servers, Nginx TLS termination, healthchecks, named volumes, resource limits.

```text
Internet → Nginx → frontend (static) + backend (Node)
                 → postgres, redis, worker
```

---

## 17. Environment Variable Specification

See root `.env.example`. Groups:

- App: `NODE_ENV`, `APP_URL`, `API_URL`, `PORT`
- DB: `DATABASE_URL`
- Redis: `REDIS_URL`
- Auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- Payments: `PAYMENT_PROVIDER`, `MTN_*`, `AIRTEL_*`
- Storage: `STORAGE_PROVIDER`, `S3_*`
- SMTP/SMS: credentials
- Business: `COMMISSION_DEFAULT_RATE_BPS`, `RETURN_WINDOW_DAYS`, currency
- CORS, rate limits, cookie flags

Secrets never committed. Separate `.env.development` / `.env.production` locally (gitignored).

---

## 18. Security Architecture

- Password hashing (argon2id or bcrypt cost ≥12)
- JWT short-lived access + rotating refresh; revoke on logout
- RBAC + object-level authorization
- Zod validation on all inputs
- Parameterized queries (Prisma)
- Helmet security headers, CORS allowlist
- Rate limiting + login throttling + account lockout
- Webhook signature verification + idempotency keys
- Upload MIME/size/dimension validation; no binaries in DB
- CSRF strategy for cookie-based flows if used
- Audit log for sensitive admin actions
- FraudRiskScore pipeline (signals → score → review, not auto-ban)
- Least-privilege DB users in production

---

## 19. UI Page Map

### Public
`/`, `/products`, `/products/:slug`, `/categories`, `/categories/:slug`, `/stores`, `/stores/:slug`, `/search`, `/deals`, `/new-arrivals`, `/best-sellers`, `/wishlist`, `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/account`, `/help`, `/about`, `/contact`, `/terms`, `/privacy`, `/returns`, `/login`, `/register`, `/sell`

### Seller portal (`/seller/*`)
Dashboard, Products (all/add/drafts/pending/published/rejected), Inventory, Orders (by status), Customers, Storefront, Promotions, Reviews, Finance, Analytics, Messages, Notifications, Settings

### Admin portal (`/admin/*`)
Dashboard, Users, Seller management, Products, Orders, Payments, Finance, Returns, Reviews, Promotions, Delivery, Reports, Analytics, Notifications, CMS, Settings, Audit logs

Every major page supports: Loading | Empty | Success | Error | Unauthorized | Forbidden | Not Found.

---

## 20. Implementation Roadmap

| Phase | Focus | Exit criteria |
|-------|--------|---------------|
| **1** | Architecture (this doc) | Stack, ERD, lifecycles, API, Docker agreed |
| **2** | Foundation | Docker up, auth, RBAC, logging, errors, health |
| **3** | Marketplace | Sellers, stores, categories, products, variants, inventory, search |
| **4** | Commerce | Cart, checkout, multi-vendor orders, delivery |
| **5** | Payments & Finance | Providers, webhooks, commission, ledger, payouts, refunds |
| **6** | CX | Wishlist, reviews, notifications, messaging, promotions |
| **7** | Admin | Dashboards, moderation, finance ops, CMS, audit |
| **8** | Production | Prod compose, nginx, backups, monitoring, CI, hardening |

---

## Design principles (non-negotiable)

1. Marketplace, not single shop — parent/seller orders always.
2. Configurable commission — never hardcoded business rates in UI.
3. Server is source of truth for price, stock, payment, permissions.
4. Immutable financial ledger; no silent balance overwrites.
5. Rwanda-first: RWF, districts, MoMo/Airtel, WhatsApp-ready.
6. Modular monolith first; events for side effects.
7. No fake dashboard metrics once DB is connected.
