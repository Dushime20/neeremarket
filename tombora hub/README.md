# NeereMarket

Production-oriented **multi-vendor marketplace for Rwanda** — modular monolith connecting customers and sellers (boutiques, markets, wholesalers, SMEs) with commission-based revenue, MTN MoMo / Airtel Money–ready payments, and RWF-first UX.

## Stack

- **Frontend:** React + TypeScript + Vite + TanStack Query + Axios + React Router
- **Backend:** Node.js + Express + TypeScript + Prisma + Zod + Pino + BullMQ
- **Data:** PostgreSQL 16 + Redis 7
- **Ops:** Docker Compose, Nginx (prod)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build -d postgres redis backend
docker compose run --rm backend npx prisma db seed
cd frontend && npm install && npm run dev
```

- Storefront: http://localhost:5173  
- API: http://localhost:4000/api/v1/health  
- API docs: http://localhost:4000/api/docs  

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tomborahub.rw | Admin@Tombora1 |
| Customer | customer@demo.rw | Demo@Tombora1 |
| Seller | seller@demo.rw | Demo@Tombora1 |

Prefer running the **API inside Docker** (it talks to Postgres on the compose network). Redis is published on host port **6380**.

## Production

```bash
cp .env.example .env   # set strong JWT secrets, real DB password, CORS, VITE_API_URL=/api/v1
docker compose -f docker-compose.production.yml up --build -d
./scripts/backup-db.sh ./backups
```

- Edge: Nginx on port 80 (`nginx/nginx.conf`) with rate limits + security headers  
- CI: `.github/workflows/ci.yml` (backend typecheck/tests, frontend build)  
- Postgres/Redis are not published publicly in production compose  

## Documentation

- [System architecture](docs/architecture/ARCHITECTURE.md) — all Phase 1 deliverables
- [Lifecycles](docs/architecture/LIFECYCLES.md)
- [ERD](docs/architecture/ERD.md)

## Implementation phases

1. Architecture ✅  
2. Foundation ✅  
3. Marketplace catalog & sellers ✅  
4. Cart, checkout, multi-vendor orders ✅  
5. Commission ledger, payouts, returns/refunds ✅  
6. Wishlist, reviews, notifications, messaging ✅  
7. Admin & CMS ✅  
8. Production hardening ✅  


```text
backend/src/
  controllers/     # HTTP handlers
  services/        # Business logic
  routes/          # Express routers
  validators/      # Zod schemas
  middlewares/     # Auth / RBAC
  providers/       # Payment & delivery abstractions
  shared/          # prisma, errors, logger, http helpers
  config/
  events/
  docs/
```

## Frontend layout (component-based)

```text
frontend/src/
  components/
    ui/            # Button, Input, Badge, Alert, Skeleton, EmptyState, Rating
    product/       # ProductCard, ProductGrid, PriceDisplay, VariantSelector, SellerCard
  pages/
  layouts/
  api/             # Axios + TanStack Query hooks
  features/        # (growing domain features)
```

## License

Proprietary — NeereMarket
