-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'OUT_OF_STOCK', 'SUSPENDED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED', 'REFURBISHED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "CommissionScope" AS ENUM ('GLOBAL', 'CATEGORY', 'SELLER', 'PRODUCT', 'PROMOTION');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('SALE', 'COMMISSION', 'REFUND', 'PAYOUT', 'ADJUSTMENT', 'DELIVERY_FEE', 'PENALTY', 'BONUS', 'AVAILABLE_RELEASE');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_REQUIRED', 'RECEIVED', 'INSPECTED', 'REFUND_PENDING', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('WRONG_PRODUCT', 'DAMAGED_PRODUCT', 'MISSING_ITEM', 'WRONG_SIZE', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('SELLER_DELIVERY', 'PLATFORM_DELIVERY', 'THIRD_PARTY', 'CUSTOMER_PICKUP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('ADJUSTMENT', 'RESERVE', 'RELEASE', 'COMMIT_SALE', 'RETURN', 'RESTOCK');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMP(3),
    "phone_verified_at" TIMESTAMP(3),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "description" TEXT,
    "business_category" TEXT,
    "province" TEXT,
    "district" TEXT,
    "sector" TEXT,
    "cell" TEXT,
    "village" TEXT,
    "market_location" TEXT,
    "shop_location" TEXT,
    "business_phone" TEXT,
    "whatsapp_number" TEXT,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "response_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_verifications" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "national_id_meta" JSONB,
    "business_reg_meta" JSONB,
    "tax_meta" JSONB,
    "payout_meta" JSONB,
    "review_notes" TEXT,
    "reviewed_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "brand_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "short_description" TEXT,
    "price" BIGINT NOT NULL,
    "discount_price" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "condition" "ProductCondition" NOT NULL DEFAULT 'NEW',
    "weight_grams" INTEGER,
    "length_mm" INTEGER,
    "width_mm" INTEGER,
    "height_mm" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seo_title" TEXT,
    "seo_description" TEXT,
    "rejection_reason" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "sales_count" INTEGER NOT NULL DEFAULT 0,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "attributes" JSONB NOT NULL,
    "price" BIGINT,
    "weight_grams" INTEGER,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_videos" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "ref_type" TEXT,
    "ref_id" UUID,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "sector" TEXT,
    "cell" TEXT,
    "village" TEXT,
    "street" TEXT,
    "landmark" TEXT,
    "kg_address" TEXT,
    "building" TEXT,
    "apartment" TEXT,
    "google_maps_url" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "instructions" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "address_id" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "subtotal" BIGINT NOT NULL,
    "delivery_fee" BIGINT NOT NULL DEFAULT 0,
    "discount_total" BIGINT NOT NULL DEFAULT 0,
    "platform_charges" BIGINT NOT NULL DEFAULT 0,
    "total" BIGINT NOT NULL,
    "coupon_code" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_orders" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "seller_order_number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal" BIGINT NOT NULL,
    "delivery_fee" BIGINT NOT NULL DEFAULT 0,
    "commission_total" BIGINT NOT NULL DEFAULT 0,
    "seller_earnings" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "seller_order_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "variant_name" TEXT,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" BIGINT NOT NULL,
    "line_total" BIGINT NOT NULL,
    "commission_rate_bps" INTEGER,
    "commission_amount" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RWF',

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT,
    "district" TEXT,
    "fee" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "seller_order_id" UUID,
    "method" "DeliveryMethod" NOT NULL,
    "provider_code" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "fee" BIGINT NOT NULL DEFAULT 0,
    "tracking_number" TEXT,
    "estimated_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "idempotency_key" TEXT NOT NULL,
    "provider_ref" TEXT,
    "failure_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "provider_ref" TEXT,
    "status" TEXT NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhooks" (
    "id" UUID NOT NULL,
    "payment_id" UUID,
    "provider" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "CommissionScope" NOT NULL,
    "scope_ref_id" UUID,
    "rate_bps" INTEGER,
    "fixed_amount" BIGINT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_transactions" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "rule_id" UUID,
    "rate_bps" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_wallets" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "pending_balance" BIGINT NOT NULL DEFAULT 0,
    "available_balance" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_ledger" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "entry_type" "LedgerEntryType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "balance_bucket" TEXT NOT NULL,
    "ref_type" TEXT,
    "ref_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "method" TEXT NOT NULL,
    "destination" JSONB NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "review_notes" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_transactions" (
    "id" UUID NOT NULL,
    "payout_request_id" UUID NOT NULL,
    "provider_ref" TEXT,
    "status" TEXT NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "reason" "ReturnReason" NOT NULL,
    "notes" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" UUID NOT NULL,
    "return_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "return_id" UUID,
    "payment_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "product_id" UUID,
    "seller_id" UUID,
    "customer_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "is_verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "wishlist_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" BIGINT NOT NULL,
    "max_discount" BIGINT,
    "min_order_amount" BIGINT,
    "usage_limit" INTEGER,
    "per_customer_limit" INTEGER,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "product_id" UUID,
    "order_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" TEXT NOT NULL,
    "score_delta" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_banners" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_pages" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "login_history_user_id_created_at_idx" ON "login_history"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_user_id_key" ON "seller_profiles"("user_id");

-- CreateIndex
CREATE INDEX "seller_profiles_verification_status_idx" ON "seller_profiles"("verification_status");

-- CreateIndex
CREATE INDEX "seller_profiles_district_idx" ON "seller_profiles"("district");

-- CreateIndex
CREATE INDEX "seller_verifications_seller_id_status_idx" ON "seller_verifications"("seller_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stores_seller_id_key" ON "stores"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_store_id_status_idx" ON "products"("store_id", "status");

-- CreateIndex
CREATE INDEX "products_category_id_status_idx" ON "products"("category_id", "status");

-- CreateIndex
CREATE INDEX "products_status_created_at_idx" ON "products"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_variant_id_key" ON "inventory"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_movements_inventory_id_created_at_idx" ON "inventory_movements"("inventory_id", "created_at");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "carts_session_id_idx" ON "carts"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_customer_id_created_at_idx" ON "orders"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seller_orders_seller_order_number_key" ON "seller_orders"("seller_order_number");

-- CreateIndex
CREATE INDEX "seller_orders_seller_id_status_idx" ON "seller_orders"("seller_id", "status");

-- CreateIndex
CREATE INDEX "seller_orders_order_id_idx" ON "seller_orders"("order_id");

-- CreateIndex
CREATE INDEX "order_items_seller_order_id_idx" ON "order_items"("seller_order_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "deliveries_order_id_idx" ON "deliveries"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_payment_id_idx" ON "payment_transactions"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhooks_payload_hash_key" ON "payment_webhooks"("payload_hash");

-- CreateIndex
CREATE INDEX "commission_rules_scope_scope_ref_id_is_active_idx" ON "commission_rules"("scope", "scope_ref_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "commission_transactions_order_item_id_key" ON "commission_transactions"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_wallets_seller_id_key" ON "seller_wallets"("seller_id");

-- CreateIndex
CREATE INDEX "seller_ledger_seller_id_created_at_idx" ON "seller_ledger"("seller_id", "created_at");

-- CreateIndex
CREATE INDEX "seller_ledger_ref_type_ref_id_idx" ON "seller_ledger"("ref_type", "ref_id");

-- CreateIndex
CREATE INDEX "payout_requests_seller_id_status_idx" ON "payout_requests"("seller_id", "status");

-- CreateIndex
CREATE INDEX "returns_order_id_idx" ON "returns"("order_id");

-- CreateIndex
CREATE INDEX "reviews_product_id_idx" ON "reviews"("product_id");

-- CreateIndex
CREATE INDEX "reviews_seller_id_idx" ON "reviews"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_key" ON "wishlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_variant_id_key" ON "wishlist_items"("wishlist_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "message_threads_customer_id_idx" ON "message_threads"("customer_id");

-- CreateIndex
CREATE INDEX "message_threads_seller_id_idx" ON "message_threads"("seller_id");

-- CreateIndex
CREATE INDEX "messages_thread_id_created_at_idx" ON "messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "fraud_events_user_id_created_at_idx" ON "fraud_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_created_at_idx" ON "analytics_events"("event_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_verifications" ADD CONSTRAINT "seller_verifications_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_videos" ADD CONSTRAINT "product_videos_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seller_order_id_fkey" FOREIGN KEY ("seller_order_id") REFERENCES "seller_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhooks" ADD CONSTRAINT "payment_webhooks_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "commission_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_wallets" ADD CONSTRAINT "seller_wallets_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_ledger" ADD CONSTRAINT "seller_ledger_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_payout_request_id_fkey" FOREIGN KEY ("payout_request_id") REFERENCES "payout_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
