import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import 'dotenv/config';
import { CATEGORY_DETAILS, DEMO_PRODUCTS, DEMO_STORES, SUBCATEGORIES } from './demo-catalog';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'orders.read',
  'orders.update',
  'payments.read',
  'payments.refund',
  'sellers.approve',
  'sellers.suspend',
  'products.approve',
  'finance.read',
  'payouts.approve',
  'settings.update',
  'audit.read',
  'cms.update',
];

const ROLES: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: PERMISSIONS.filter((p) => p !== 'settings.update'),
  FINANCE_ADMIN: ['payments.read', 'payments.refund', 'finance.read', 'payouts.approve', 'orders.read'],
  SELLER_ADMIN: ['sellers.approve', 'sellers.suspend', 'products.approve', 'orders.read'],
  ORDER_ADMIN: ['orders.read', 'orders.update', 'payments.read'],
  CUSTOMER_SUPPORT: ['orders.read', 'payments.read'],
  CONTENT_ADMIN: ['cms.update', 'products.approve'],
  MARKETING_ADMIN: ['cms.update'],
  SELLER: [],
  CUSTOMER: [],
};

const CATEGORIES = [
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Phones', slug: 'phones' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Home & Living', slug: 'home-living' },
  { name: 'Shoes', slug: 'shoes' },
  { name: 'Bags', slug: 'bags' },
  { name: 'Baby Products', slug: 'baby-products' },
  { name: 'Grocery', slug: 'grocery' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Automotive', slug: 'automotive' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Furniture', slug: 'furniture' },
  { name: 'Office', slug: 'office' },
  { name: 'Local Products', slug: 'local-products' },
];

async function main() {
  console.log('Seeding Tombora Hub (development/demo data)...');

  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: code },
    });
  }

  for (const [code, perms] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: code.replace(/_/g, ' ') },
      create: { code, name: code.replace(/_/g, ' ') },
    });

    for (const permCode of perms) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permCode } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  let sort = 0;
  for (const cat of CATEGORIES) {
    const extra = CATEGORY_DETAILS[cat.slug];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        sortOrder: sort,
        description: extra?.description,
        imageUrl: extra?.imageUrl,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        sortOrder: sort,
        isActive: true,
        description: extra?.description,
        imageUrl: extra?.imageUrl,
      },
    });
    sort += 1;
  }

  for (const [parentSlug, subs] of Object.entries(SUBCATEGORIES)) {
    const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
    if (!parent) continue;
    let childSort = 0;
    for (const sub of subs) {
      const parentVisual = CATEGORY_DETAILS[parentSlug];
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          parentId: parent.id,
          sortOrder: childSort,
          isActive: true,
          imageUrl: parentVisual?.imageUrl,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: parent.id,
          sortOrder: childSort,
          isActive: true,
          imageUrl: parentVisual?.imageUrl,
        },
      });
      childSort += 1;
    }
  }

  await prisma.commissionRule.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: { rateBps: 1000, isActive: true },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Global default commission',
      scope: 'GLOBAL',
      rateBps: 1000,
      priority: 0,
      isActive: true,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'return_window_days' },
    update: { value: 7 },
    create: { key: 'return_window_days', value: 7 },
  });
  await prisma.setting.upsert({
    where: { key: 'product_auto_approve' },
    update: { value: false },
    create: { key: 'product_auto_approve', value: false },
  });
  await prisma.setting.upsert({
    where: { key: 'default_currency' },
    update: { value: 'RWF' },
    create: { key: 'default_currency', value: 'RWF' },
  });

  const passwordHash = await argon2.hash('Admin@Tombora1', { type: argon2.argon2id });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tomborahub.rw' },
    update: {},
    create: {
      email: 'admin@tomborahub.rw',
      phone: '+250780000001',
      fullName: 'Tombora Admin',
      passwordHash,
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: adminRole.id }] },
    },
  });

  const customerRole = await prisma.role.findUniqueOrThrow({ where: { code: 'CUSTOMER' } });
  const sellerRole = await prisma.role.findUniqueOrThrow({ where: { code: 'SELLER' } });
  const demoPassword = await argon2.hash('Demo@Tombora1', { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { email: 'customer@demo.rw' },
    update: {},
    create: {
      email: 'customer@demo.rw',
      phone: '+250780000002',
      fullName: 'Demo Customer',
      passwordHash: demoPassword,
      roles: { create: [{ roleId: customerRole.id }] },
    },
  });

  const storeIds = new Map<string, string>();

  for (const shop of DEMO_STORES) {
    const user = await prisma.user.upsert({
      where: { email: shop.email },
      update: { fullName: shop.fullName, phone: shop.phone, passwordHash: demoPassword },
      create: {
        email: shop.email,
        phone: shop.phone,
        fullName: shop.fullName,
        passwordHash: demoPassword,
        roles: { create: [{ roleId: sellerRole.id }] },
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: sellerRole.id } },
      update: {},
      create: { userId: user.id, roleId: sellerRole.id },
    });

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: shop.businessName,
        description: shop.description,
        businessCategory: shop.businessCategory,
        province: 'Kigali City',
        district: shop.district,
        sector: shop.sector,
        marketLocation: shop.marketLocation,
        shopLocation: shop.shopLocation,
        businessPhone: shop.phone,
        whatsappNumber: shop.phone,
        logoUrl: shop.logoUrl,
        coverUrl: shop.coverUrl,
        verificationStatus: 'VERIFIED',
        ratingAvg: 4.7,
        ratingCount: 24,
      },
      create: {
        userId: user.id,
        businessName: shop.businessName,
        description: shop.description,
        businessCategory: shop.businessCategory,
        province: 'Kigali City',
        district: shop.district,
        sector: shop.sector,
        marketLocation: shop.marketLocation,
        shopLocation: shop.shopLocation,
        businessPhone: shop.phone,
        whatsappNumber: shop.phone,
        logoUrl: shop.logoUrl,
        coverUrl: shop.coverUrl,
        verificationStatus: 'VERIFIED',
        ratingAvg: 4.7,
        ratingCount: 24,
        wallet: { create: {} },
      },
    });

    await prisma.sellerWallet.upsert({
      where: { sellerId: profile.id },
      update: {},
      create: { sellerId: profile.id },
    });

    const store = await prisma.store.upsert({
      where: { slug: shop.slug },
      update: {
        name: shop.businessName,
        description: shop.description,
        isActive: true,
        seoTitle: `${shop.businessName} | Tombora Hub`,
        seoDescription: shop.description,
      },
      create: {
        sellerId: profile.id,
        name: shop.businessName,
        slug: shop.slug,
        description: shop.description,
        isActive: true,
        seoTitle: `${shop.businessName} | Tombora Hub`,
        seoDescription: shop.description,
      },
    });

    storeIds.set(shop.slug, store.id);
  }

  for (const item of DEMO_PRODUCTS) {
    const storeId = storeIds.get(item.storeSlug);
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: item.categorySlug } });
    if (!storeId) continue;

    const brand = await prisma.brand.upsert({
      where: { slug: item.brandSlug },
      update: { name: item.brandName, isActive: true },
      create: { name: item.brandName, slug: item.brandSlug, isActive: true },
    });

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        sku: item.sku,
        shortDescription: item.shortDescription,
        description: item.description,
        price: BigInt(item.price),
        discountPrice: item.discountPrice != null ? BigInt(item.discountPrice) : null,
        status: 'ACTIVE',
        tags: item.tags,
        seoTitle: `${item.name} | Tombora Hub`,
        seoDescription: item.shortDescription,
        ratingAvg: item.ratingAvg,
        ratingCount: item.ratingCount,
        salesCount: item.salesCount,
        categoryId: category.id,
        brandId: brand.id,
        storeId,
      },
      create: {
        storeId,
        categoryId: category.id,
        brandId: brand.id,
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        shortDescription: item.shortDescription,
        description: item.description,
        price: BigInt(item.price),
        discountPrice: item.discountPrice != null ? BigInt(item.discountPrice) : null,
        currency: 'RWF',
        status: 'ACTIVE',
        tags: item.tags,
        seoTitle: `${item.name} | Tombora Hub`,
        seoDescription: item.shortDescription,
        ratingAvg: item.ratingAvg,
        ratingCount: item.ratingCount,
        salesCount: item.salesCount,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: item.images.map((url, index) => ({
        productId: product.id,
        url,
        altText: `${item.name} photo ${index + 1}`,
        isPrimary: index === 0,
        sortOrder: index,
      })),
    });

    for (const variant of item.variants) {
      const saved = await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          name: variant.name,
          attributes: variant.attrs,
          price: variant.price != null ? BigInt(variant.price) : BigInt(item.discountPrice ?? item.price),
          isActive: true,
          productId: product.id,
        },
        create: {
          productId: product.id,
          sku: variant.sku,
          name: variant.name,
          attributes: variant.attrs,
          price: variant.price != null ? BigInt(variant.price) : BigInt(item.discountPrice ?? item.price),
        },
      });

      await prisma.inventory.upsert({
        where: { variantId: saved.id },
        update: { quantity: variant.stock, reserved: 0, lowStockThreshold: 5 },
        create: {
          variantId: saved.id,
          quantity: variant.stock,
          reserved: 0,
          lowStockThreshold: 5,
        },
      });
    }
  }

  await prisma.cmsBanner.upsert({
    where: { id: '00000000-0000-4000-8000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000010',
      title: 'Shop Rwanda. Support local sellers.',
      subtitle: 'Fashion, electronics, beauty & more — delivered across Kigali and beyond.',
      imageUrl: 'https://placehold.co/1600x700/0f2f1f/e8f0ea?text=Tombora+Hub',
      linkUrl: '/products',
      sortOrder: 0,
      isActive: true,
    },
  });

  console.log('Seed complete.');
  console.log('Admin: admin@tomborahub.rw / Admin@Tombora1');
  console.log('Customer: customer@demo.rw / Demo@Tombora1');
  console.log('Sellers (password Demo@Tombora1):');
  console.log('  seller@demo.rw — Downtown Fashion Kigali');
  console.log('  gadgets@demo.rw — Kigali Gadget Hub');
  console.log('  beauty@demo.rw — Nyamirambo Glow');
  console.log('  harvest@demo.rw — Kimironko Harvest');
  console.log('  living@demo.rw — Gasabo Living');
  console.log('  sport@demo.rw — Amahoro Sports Kit');
  console.log('  auto@demo.rw — Kicukiro Auto Care');
  console.log('  baby@demo.rw — Gisozi Baby Nest');
  console.log('  office@demo.rw — Kacyiru Desk Lab');
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
