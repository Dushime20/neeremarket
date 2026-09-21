export const CATEGORY_DETAILS: Record<string, { description: string; imageUrl: string }> = {
  fashion: {
    description: 'Kigali streetwear, market tailoring, and everyday outfits from downtown boutiques.',
    imageUrl:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
  electronics: {
    description: 'Phones, audio, power, and gadgets for work and home.',
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  },
  phones: {
    description: 'Smartphones, cases, and accessories with local warranty support.',
    imageUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
  },
  beauty: {
    description: 'Skincare, hair, and glow essentials from Nyamirambo and beyond.',
    imageUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
  },
  'home-living': {
    description: 'Textiles, décor, and practical pieces for Rwandan homes.',
    imageUrl:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
  },
  shoes: {
    description: 'Sneakers, sandals, and everyday shoes for Kigali streets.',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  },
  bags: {
    description: 'Crossbodies, totes, and market bags built for daily errands.',
    imageUrl:
      'https://images.unsplash.com/photo-1590874103328-eac38a941278?auto=format&fit=crop&w=900&q=80',
  },
  'baby-products': {
    description: 'Soft essentials for the first years — clothing, care, and carry.',
    imageUrl:
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=900&q=80',
  },
  grocery: {
    description: 'Pantry staples, snacks, and fresh-packed goods from Kimironko sellers.',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  },
  sports: {
    description: 'Training kits, balls, and outdoor gear.',
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066027b?auto=format&fit=crop&w=900&q=80',
  },
  automotive: {
    description: 'Car care, phone mounts, and road accessories.',
    imageUrl:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
  },
  accessories: {
    description: 'Jewelry, watches, and small finishing pieces.',
    imageUrl:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80',
  },
  furniture: {
    description: 'Compact tables, stools, and handmade living pieces.',
    imageUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
  },
  office: {
    description: 'Deskside tools for Kigali startups and home offices.',
    imageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
  },
  'local-products': {
    description: 'Coffee, honey, chili oil, crafts, and Made-in-Rwanda favorites.',
    imageUrl:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
  },
};

export const SUBCATEGORIES: Record<string, { name: string; slug: string }[]> = {
  fashion: [
    { name: "Women's wear", slug: 'fashion-womens-wear' },
    { name: "Men's wear", slug: 'fashion-mens-wear' },
    { name: 'Dresses', slug: 'fashion-dresses' },
    { name: 'Traditional wear', slug: 'fashion-traditional' },
    { name: 'Kids fashion', slug: 'fashion-kids' },
    { name: 'Activewear', slug: 'fashion-activewear' },
  ],
  electronics: [
    { name: 'Laptops', slug: 'electronics-laptops' },
    { name: 'Audio', slug: 'electronics-audio' },
    { name: 'TV & displays', slug: 'electronics-tv' },
    { name: 'Power & cables', slug: 'electronics-power' },
    { name: 'Smart home', slug: 'electronics-smart-home' },
    { name: 'Gaming', slug: 'electronics-gaming' },
  ],
  phones: [
    { name: 'Smartphones', slug: 'phones-smartphones' },
    { name: 'Cases', slug: 'phones-cases' },
    { name: 'Chargers', slug: 'phones-chargers' },
    { name: 'Earbuds', slug: 'phones-earbuds' },
    { name: 'Screen guards', slug: 'phones-screen-guards' },
  ],
  beauty: [
    { name: 'Skincare', slug: 'beauty-skincare' },
    { name: 'Makeup', slug: 'beauty-makeup' },
    { name: 'Hair care', slug: 'beauty-hair' },
    { name: 'Fragrance', slug: 'beauty-fragrance' },
    { name: 'Tools & bags', slug: 'beauty-tools' },
  ],
  'home-living': [
    { name: 'Kitchen', slug: 'home-living-kitchen' },
    { name: 'Bedding', slug: 'home-living-bedding' },
    { name: 'Décor', slug: 'home-living-decor' },
    { name: 'Storage', slug: 'home-living-storage' },
    { name: 'Lighting', slug: 'home-living-lighting' },
  ],
  shoes: [
    { name: 'Sneakers', slug: 'shoes-sneakers' },
    { name: 'Sandals', slug: 'shoes-sandals' },
    { name: 'Formal', slug: 'shoes-formal' },
    { name: 'Boots', slug: 'shoes-boots' },
  ],
  bags: [
    { name: 'Totes', slug: 'bags-totes' },
    { name: 'Crossbody', slug: 'bags-crossbody' },
    { name: 'Backpacks', slug: 'bags-backpacks' },
    { name: 'Travel', slug: 'bags-travel' },
  ],
  grocery: [
    { name: 'Pantry', slug: 'grocery-pantry' },
    { name: 'Snacks', slug: 'grocery-snacks' },
    { name: 'Beverages', slug: 'grocery-beverages' },
    { name: 'Spices', slug: 'grocery-spices' },
    { name: 'Fresh packs', slug: 'grocery-fresh' },
  ],
  'baby-products': [
    { name: 'Clothing', slug: 'baby-clothing' },
    { name: 'Care & hygiene', slug: 'baby-care' },
    { name: 'Feeding', slug: 'baby-feeding' },
    { name: 'Strollers & carry', slug: 'baby-carry' },
  ],
  sports: [
    { name: 'Football', slug: 'sports-football' },
    { name: 'Training gear', slug: 'sports-training' },
    { name: 'Outdoor', slug: 'sports-outdoor' },
    { name: 'Cycling', slug: 'sports-cycling' },
  ],
  automotive: [
    { name: 'Car care', slug: 'auto-car-care' },
    { name: 'Interior accessories', slug: 'auto-interior' },
    { name: 'Phone mounts', slug: 'auto-phone-mounts' },
    { name: 'Oils & fluids', slug: 'auto-oils' },
  ],
  accessories: [
    { name: 'Jewelry', slug: 'accessories-jewelry' },
    { name: 'Watches', slug: 'accessories-watches' },
    { name: 'Hats & scarves', slug: 'accessories-hats' },
    { name: 'Belts', slug: 'accessories-belts' },
  ],
  furniture: [
    { name: 'Living room', slug: 'furniture-living' },
    { name: 'Bedroom', slug: 'furniture-bedroom' },
    { name: 'Office desks', slug: 'furniture-office' },
    { name: 'Outdoor seating', slug: 'furniture-outdoor' },
  ],
  office: [
    { name: 'Stationery', slug: 'office-stationery' },
    { name: 'Deskside tools', slug: 'office-tools' },
    { name: 'Printers & ink', slug: 'office-printers' },
    { name: 'Filing', slug: 'office-filing' },
  ],
  'local-products': [
    { name: 'Coffee & tea', slug: 'local-coffee-tea' },
    { name: 'Honey & oils', slug: 'local-honey-oils' },
    { name: 'Crafts', slug: 'local-crafts' },
    { name: 'Textiles', slug: 'local-textiles' },
  ],
};

export type DemoStore = {
  email: string;
  phone: string;
  fullName: string;
  businessName: string;
  slug: string;
  description: string;
  businessCategory: string;
  district: string;
  sector: string;
  marketLocation: string;
  shopLocation: string;
  logoUrl: string;
  coverUrl: string;
};

export const DEMO_STORES: DemoStore[] = [
  {
    email: 'seller@demo.rw',
    phone: '+250780000003',
    fullName: 'Uwase Marie',
    businessName: 'Downtown Fashion Kigali',
    slug: 'downtown-fashion-kigali',
    description:
      'A Nyarugenge boutique stocking tailored shirts, tees, bags, and sneakers for Kigali weather. Walk-in shop B12, downtown market.',
    businessCategory: 'Fashion',
    district: 'Nyarugenge',
    sector: 'Nyarugenge',
    marketLocation: 'Kigali Downtown',
    shopLocation: 'Shop B12',
    logoUrl:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'gadgets@demo.rw',
    phone: '+250780000004',
    fullName: 'Jean Bosco Niyonzima',
    businessName: 'Kigali Gadget Hub',
    slug: 'kigali-gadget-hub',
    description:
      'Phones, earbuds, power banks, and speakers with same-week Kigali delivery. Verified stall in Kimironko.',
    businessCategory: 'Electronics',
    district: 'Gasabo',
    sector: 'Kimironko',
    marketLocation: 'Kimironko Market',
    shopLocation: 'Electronics row, stall 18',
    logoUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'beauty@demo.rw',
    phone: '+250780000005',
    fullName: 'Ingabire Aline',
    businessName: 'Nyamirambo Glow',
    slug: 'nyamirambo-glow',
    description:
      'Shea, serums, and braiding hair from a Nyamirambo beauty house known for weekend appointments.',
    businessCategory: 'Beauty',
    district: 'Nyarugenge',
    sector: 'Nyamirambo',
    marketLocation: 'Nyamirambo',
    shopLocation: 'KN 2 Ave, salon 4',
    logoUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc37ea9?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'harvest@demo.rw',
    phone: '+250780000006',
    fullName: 'Habimana Eric',
    businessName: 'Kimironko Harvest',
    slug: 'kimironko-harvest',
    description:
      'Coffee, honey, chili oil, and dried fruit packed for MoMo checkout. Sourced from cooperatives around Rwanda.',
    businessCategory: 'Grocery',
    district: 'Gasabo',
    sector: 'Kimironko',
    marketLocation: 'Kimironko Market',
    shopLocation: 'Food court, stall 7',
    logoUrl:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'living@demo.rw',
    phone: '+250780000007',
    fullName: 'Mukamana Diane',
    businessName: 'Gasabo Living',
    slug: 'gasabo-living',
    description:
      'Imigongo, agaseke, bedding, and compact furniture for apartments from Remera to Gisozi.',
    businessCategory: 'Home & Living',
    district: 'Gasabo',
    sector: 'Remera',
    marketLocation: 'Remera',
    shopLocation: 'KG 11 Ave, studio 2',
    logoUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'sport@demo.rw',
    phone: '+250780000008',
    fullName: 'Mugisha Patrick',
    businessName: 'Amahoro Sports Kit',
    slug: 'amahoro-sports-kit',
    description: 'Training kits, balls, and outdoor gear near Amahoro Stadium.',
    businessCategory: 'Sports',
    district: 'Gasabo',
    sector: 'Remera',
    marketLocation: 'Remera',
    shopLocation: 'KG 17 Ave',
    logoUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066027b?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'auto@demo.rw',
    phone: '+250780000009',
    fullName: 'Nsabimana Claude',
    businessName: 'Kicukiro Auto Care',
    slug: 'kicukiro-auto-care',
    description: 'Car care, phone mounts, and road accessories from Kicukiro.',
    businessCategory: 'Automotive',
    district: 'Kicukiro',
    sector: 'Gatenga',
    marketLocation: 'Kicukiro',
    shopLocation: 'KK 15 Rd',
    logoUrl:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'baby@demo.rw',
    phone: '+250780000010',
    fullName: 'Uwimana Grace',
    businessName: 'Gisozi Baby Nest',
    slug: 'gisozi-baby-nest',
    description: 'Soft essentials for the first years — clothing, care, and carry.',
    businessCategory: 'Baby Products',
    district: 'Gasabo',
    sector: 'Gisozi',
    marketLocation: 'Gisozi',
    shopLocation: 'KG 7 Ave',
    logoUrl:
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1400&q=80',
  },
  {
    email: 'office@demo.rw',
    phone: '+250780000011',
    fullName: 'Kalisa Divine',
    businessName: 'Kacyiru Desk Lab',
    slug: 'kacyiru-desk-lab',
    description: 'Deskside tools for Kigali startups and home offices.',
    businessCategory: 'Office',
    district: 'Gasabo',
    sector: 'Kacyiru',
    marketLocation: 'Kacyiru',
    shopLocation: 'KG 7 Ave, suite 3',
    logoUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80',
  },
];

export type DemoProduct = {
  storeSlug: string;
  categorySlug: string;
  brandName: string;
  brandSlug: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number;
  tags: string[];
  images: string[];
  ratingAvg: string;
  ratingCount: number;
  salesCount: number;
  variants: { sku: string; name: string; attrs: Record<string, string>; stock: number; price?: number }[];
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    storeSlug: 'downtown-fashion-kigali',
    categorySlug: 'fashion',
    brandName: 'Kigali Wear',
    brandSlug: 'kigali-wear',
    name: 'Classic Cotton T-Shirt',
    slug: 'classic-cotton-tshirt',
    sku: 'TS-BASE',
    shortDescription: 'Soft cotton tee cut for Kigali heat — black or white, M and XL.',
    description: `A everyday crew-neck tee from Downtown Fashion Kigali.

Fabric & feel
• 180 GSM combed cotton that stays breathable on KN 3 Rd afternoons
• Pre-washed so the first wear is already soft
• Ribbed collar that holds shape after market-day washes

Fit
Regular, slightly relaxed through the chest. Pair it with chinos for the office or denim for Nyamirambo evenings.

Care
Cold wash, hang dry in shade. Do not bleach. Iron on reverse.

Why this listing
This is our most-ordered basic. Stocked in the downtown stall (Shop B12) and packed the same day for MoMo checkout.`,
    price: 15000,
    discountPrice: 12000,
    tags: ['fashion', 'tshirt', 'cotton', 'kigali'],
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a99b?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.60',
    ratingCount: 38,
    salesCount: 214,
    variants: [
      { sku: 'TS-BLK-M', name: 'Black / M', attrs: { color: 'Black', size: 'M' }, stock: 40, price: 12000 },
      { sku: 'TS-BLK-XL', name: 'Black / XL', attrs: { color: 'Black', size: 'XL' }, stock: 25, price: 12000 },
      { sku: 'TS-WHT-M', name: 'White / M', attrs: { color: 'White', size: 'M' }, stock: 30, price: 12000 },
    ],
  },
  {
    storeSlug: 'downtown-fashion-kigali',
    categorySlug: 'fashion',
    brandName: 'Kigali Wear',
    brandSlug: 'kigali-wear',
    name: 'Kigali Linen Shirt',
    slug: 'kigali-linen-shirt',
    sku: 'LN-SHIRT',
    shortDescription: 'Light linen shirt for office, church, and weekend terraces.',
    description: `A long-sleeve linen shirt tailored in Nyarugenge.

Details
• Airy European-blend linen that dries fast in rainy season
• Coconut buttons and a hidden extra at the hem
• Slight ease in the shoulders so you can ride a moto without pulling seams

Wear it
Open over a tee at Ubumwe, or buttoned with dark trousers for client meetings in Kacyiru.

Included
Spare button, care card in Kinyarwanda and English, folded in tissue from Shop B12.`,
    price: 38000,
    discountPrice: 32500,
    tags: ['fashion', 'linen', 'shirt'],
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.80',
    ratingCount: 21,
    salesCount: 67,
    variants: [
      { sku: 'LN-SAND-M', name: 'Sand / M', attrs: { color: 'Sand', size: 'M' }, stock: 18 },
      { sku: 'LN-SAND-L', name: 'Sand / L', attrs: { color: 'Sand', size: 'L' }, stock: 14 },
      { sku: 'LN-OLV-M', name: 'Olive / M', attrs: { color: 'Olive', size: 'M' }, stock: 12 },
    ],
  },
  {
    storeSlug: 'downtown-fashion-kigali',
    categorySlug: 'bags',
    brandName: 'Kigali Wear',
    brandSlug: 'kigali-wear',
    name: 'Leather Crossbody Bag',
    slug: 'leather-crossbody-bag',
    sku: 'BAG-XB',
    shortDescription: 'Compact leather crossbody with a phone sleeve and zip pocket.',
    description: `Handmade leather crossbody for markets, offices, and evening plans.

Inside
• Main zip compartment fits a small water bottle and notebook
• Rear slip pocket for MTN/Airtel SIM packs and receipts
• Interior phone sleeve sized for common Android flagships

Strap
Adjustable, sits comfortably across a moto jacket. Hardware is antique brass, not painted plastic.

Care
Wipe with a dry cloth. Condition every few months. Avoid leaving in a hot car on tarmac days.`,
    price: 45000,
    tags: ['bags', 'leather', 'crossbody'],
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1590874103328-eac38a941278?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.70',
    ratingCount: 16,
    salesCount: 41,
    variants: [
      { sku: 'BAG-XB-TAN', name: 'Tan', attrs: { color: 'Tan' }, stock: 11 },
      { sku: 'BAG-XB-BLK', name: 'Black', attrs: { color: 'Black' }, stock: 9 },
    ],
  },
  {
    storeSlug: 'downtown-fashion-kigali',
    categorySlug: 'shoes',
    brandName: 'Kigali Wear',
    brandSlug: 'kigali-wear',
    name: 'Canvas Kigali Sneakers',
    slug: 'canvas-kigali-sneakers',
    sku: 'SNK-CV',
    shortDescription: 'Everyday canvas sneakers with a cushioned insole for city walking.',
    description: `Low-profile canvas sneakers built for Kigali hills and office parks.

Construction
• Breathable canvas upper
• Rubber outsole with a mild tread for wet tile
• Removable foam insole

Sizing
True to size. If you are between sizes, take the larger — especially if you wear thicker socks in the rainy season.

Packaging
Ships in a reusable cloth bag instead of a bulky box when you choose city delivery.`,
    price: 28000,
    discountPrice: 23900,
    tags: ['shoes', 'sneakers', 'canvas'],
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.40',
    ratingCount: 29,
    salesCount: 88,
    variants: [
      { sku: 'SNK-WHT-40', name: 'White / 40', attrs: { color: 'White', size: '40' }, stock: 8 },
      { sku: 'SNK-WHT-42', name: 'White / 42', attrs: { color: 'White', size: '42' }, stock: 10 },
      { sku: 'SNK-BLK-42', name: 'Black / 42', attrs: { color: 'Black', size: '42' }, stock: 7 },
    ],
  },
  {
    storeSlug: 'kigali-gadget-hub',
    categorySlug: 'phones',
    brandName: 'Horizon Mobile',
    brandSlug: 'horizon-mobile',
    name: 'Horizon A12 Smartphone 128GB',
    slug: 'horizon-a12-smartphone-128gb',
    sku: 'PH-A12',
    shortDescription: '128GB Android phone with dual SIM, 5000mAh battery, and Kigali pickup.',
    description: `A dual-SIM daily driver from Kigali Gadget Hub.

Hardware
• 6.6" FHD+ display
• 128GB storage, microSD up to 512GB
• 5000mAh battery, 33W charging in the box
• 50MP rear camera, 8MP front

Local extras
We flash the latest stable build, insert a screen protector, and test both SIM trays (MTN and Airtel) before you collect in Kimironko.

Warranty
6 months seller warranty on hardware. Liquid damage not covered. Bring the receipt from Tombora Hub for service.`,
    price: 285000,
    discountPrice: 259000,
    tags: ['phones', 'android', 'dual-sim'],
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.50',
    ratingCount: 54,
    salesCount: 132,
    variants: [
      { sku: 'PH-A12-BLK', name: 'Midnight Black', attrs: { color: 'Midnight Black' }, stock: 15 },
      { sku: 'PH-A12-BLU', name: 'Lake Blue', attrs: { color: 'Lake Blue' }, stock: 9 },
    ],
  },
  {
    storeSlug: 'kigali-gadget-hub',
    categorySlug: 'electronics',
    brandName: 'Horizon Mobile',
    brandSlug: 'horizon-mobile',
    name: 'Pulse Wireless Earbuds',
    slug: 'pulse-wireless-earbuds',
    sku: 'EB-PULSE',
    shortDescription: 'ENC earbuds with a charging case — 28 hours total, USB-C.',
    description: `True wireless earbuds tuned for calls on noisy KN roads.

Audio
• 10mm drivers
• Environmental noise control on the mics
• IPX4 splash resistance

Battery
6 hours per charge, 28 hours with the case. USB-C cable included.

Pairing
Holds two devices — useful if you hop between a work laptop and your phone.`,
    price: 32000,
    discountPrice: 27500,
    tags: ['electronics', 'audio', 'earbuds'],
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.30',
    ratingCount: 47,
    salesCount: 190,
    variants: [
      { sku: 'EB-PULSE-WHT', name: 'White', attrs: { color: 'White' }, stock: 22 },
      { sku: 'EB-PULSE-BLK', name: 'Black', attrs: { color: 'Black' }, stock: 19 },
    ],
  },
  {
    storeSlug: 'kigali-gadget-hub',
    categorySlug: 'electronics',
    brandName: 'Horizon Mobile',
    brandSlug: 'horizon-mobile',
    name: '20000mAh Fast Power Bank',
    slug: 'fast-power-bank-20000',
    sku: 'PB-20K',
    shortDescription: 'Two-port 20,000mAh pack with LED indicator and USB-C in/out.',
    description: `Keep a phone and a small tablet alive through a long market day.

Ports
• USB-C in/out (18W)
• USB-A 2.4A
• LED battery bars you can read in daylight

Safety
Over-charge, short-circuit, and temperature protection. Do not leave on a dashboard in direct sun.

In the box
Power bank, 30cm USB-C cable, quick-start card.`,
    price: 24500,
    tags: ['electronics', 'power', 'travel'],
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.60',
    ratingCount: 33,
    salesCount: 76,
    variants: [{ sku: 'PB-20K-GRY', name: 'Graphite', attrs: { color: 'Graphite' }, stock: 28 }],
  },
  {
    storeSlug: 'kigali-gadget-hub',
    categorySlug: 'electronics',
    brandName: 'Horizon Mobile',
    brandSlug: 'horizon-mobile',
    name: 'Portable Bluetooth Speaker',
    slug: 'portable-bluetooth-speaker',
    sku: 'SPK-GO',
    shortDescription: 'IPX5 speaker with 12-hour playtime — backyard, shop, or lake day.',
    description: `A compact speaker with a surprising low end for its size.

Use it
Shopfront background music, Gisenyi weekends, or a Remera balcony.

Features
• Bluetooth 5.3
• IPX5 splash resistance
• USB-C charge, 12 hours at mid volume
• Pair two speakers if you buy a second unit (TWS)`,
    price: 41000,
    discountPrice: 36900,
    tags: ['electronics', 'audio', 'speaker'],
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbbaed06b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.20',
    ratingCount: 18,
    salesCount: 44,
    variants: [
      { sku: 'SPK-GO-BLU', name: 'Blue', attrs: { color: 'Blue' }, stock: 13 },
      { sku: 'SPK-GO-RED', name: 'Red', attrs: { color: 'Red' }, stock: 8 },
    ],
  },
  {
    storeSlug: 'nyamirambo-glow',
    categorySlug: 'beauty',
    brandName: 'Nyami Botanics',
    brandSlug: 'nyami-botanics',
    name: 'Shea Butter Body Cream 250ml',
    slug: 'shea-butter-body-cream',
    sku: 'BEA-SHEA',
    shortDescription: 'Whipped shea cream with vanilla and coconut — unscented option too.',
    description: `A dense, fast-absorbing body cream mixed in small batches in Nyamirambo.

Ingredients
Unrefined shea butter, coconut oil, vitamin E. No mineral oil. Two finishes: Vanilla Coconut or Unscented for sensitive skin.

How to use
Warm a pea-size amount between palms. Apply after bathing while skin is slightly damp. A little goes far in dry season.

Shelf
Best within 8 months of opening. Keep the lid tight; store away from direct sun.`,
    price: 9500,
    discountPrice: 7900,
    tags: ['beauty', 'shea', 'skincare'],
    images: [
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1571781926291-c777666acd1b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.90',
    ratingCount: 62,
    salesCount: 240,
    variants: [
      { sku: 'BEA-SHEA-VAN', name: 'Vanilla Coconut', attrs: { scent: 'Vanilla Coconut' }, stock: 40 },
      { sku: 'BEA-SHEA-UNS', name: 'Unscented', attrs: { scent: 'Unscented' }, stock: 22 },
    ],
  },
  {
    storeSlug: 'nyamirambo-glow',
    categorySlug: 'beauty',
    brandName: 'Nyami Botanics',
    brandSlug: 'nyami-botanics',
    name: 'Kigali Glow Vitamin C Serum',
    slug: 'kigali-glow-vitamin-c-serum',
    sku: 'BEA-SER',
    shortDescription: '15% vitamin C serum with hyaluronic acid, 30ml dropper bottle.',
    description: `A brightening serum for dull, sun-tired skin.

Formula
15% ethylated ascorbic acid, hyaluronic acid, niacinamide 4%. Fragrance-free.

Routine
AM: cleanse, 3 drops, moisturizer, SPF. PM: optional, skip if you use a strong retinoid the same night.

Notes
May tingle for the first week. Patch test on the jaw. Store in a cool cupboard — not the bathroom window.`,
    price: 18000,
    tags: ['beauty', 'serum', 'vitamin-c'],
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1571875257727-256c89da67b7?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.70',
    ratingCount: 27,
    salesCount: 71,
    variants: [{ sku: 'BEA-SER-30', name: '30ml', attrs: { size: '30ml' }, stock: 35 }],
  },
  {
    storeSlug: 'nyamirambo-glow',
    categorySlug: 'beauty',
    brandName: 'Nyami Botanics',
    brandSlug: 'nyami-botanics',
    name: 'Pre-stretched Braiding Hair Pack',
    slug: 'braiding-hair-pack',
    sku: 'BEA-BRD',
    shortDescription: 'Pre-stretched braiding hair — 6 packs, low shed, heat friendly.',
    description: `Salon-grade pre-stretched hair used in our Nyamirambo chairs.

Pack
6 bundles, enough for a full box-braid install on shoulder-to-mid-back length (varies by density).

Colors
1B natural black, 4 chocolate, or a 1B/30 highlight mix.

Tips
Dip ends in hot water. Do not use a direct flame. We include a small edge-control sachet.`,
    price: 16000,
    discountPrice: 14500,
    tags: ['beauty', 'hair', 'braids'],
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc37ea9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.80',
    ratingCount: 41,
    salesCount: 156,
    variants: [
      { sku: 'BEA-BRD-1B', name: '1B Black', attrs: { color: '1B Black' }, stock: 30 },
      { sku: 'BEA-BRD-4', name: '4 Chocolate', attrs: { color: '4 Chocolate' }, stock: 18 },
      { sku: 'BEA-BRD-MIX', name: '1B/30 Mix', attrs: { color: '1B/30 Mix' }, stock: 12 },
    ],
  },
  {
    storeSlug: 'kimironko-harvest',
    categorySlug: 'local-products',
    brandName: 'Thousand Hills',
    brandSlug: 'thousand-hills',
    name: 'Rwandan Coffee 1kg (Fully Washed)',
    slug: 'rwandan-coffee-1kg',
    sku: 'LOC-COF',
    shortDescription: 'Fully washed Bourbon from the Western Province — 1kg retail bag.',
    description: `Single-origin Bourbon, fully washed, roasted in small batches for Tombora shoppers.

Cup
Red fruit, brown sugar, clean finish. Works as pour-over or moka pot. Not an oily espresso roast.

Farm notes
Cherries from cooperative lots around Nyamasheke. Altitude 1,700–1,900m. We print the roast date on every bag.

Grind
Whole bean by default. Choose ground-for-filter if you do not have a mill at home — we grind the morning we pack.`,
    price: 22000,
    discountPrice: 19800,
    tags: ['local', 'coffee', 'grocery'],
    images: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.90',
    ratingCount: 88,
    salesCount: 310,
    variants: [
      { sku: 'LOC-COF-BEAN', name: 'Whole bean', attrs: { grind: 'Whole bean' }, stock: 50 },
      { sku: 'LOC-COF-FLT', name: 'Ground for filter', attrs: { grind: 'Filter' }, stock: 36 },
    ],
  },
  {
    storeSlug: 'kimironko-harvest',
    categorySlug: 'grocery',
    brandName: 'Thousand Hills',
    brandSlug: 'thousand-hills',
    name: 'Akabanga Chili Oil 125ml',
    slug: 'akabanga-chili-oil-125ml',
    sku: 'LOC-AKA',
    shortDescription: 'The dropper chili oil — 125ml glass, ready for chips, eggs, and brochettes.',
    description: `A pantry icon. One drop changes ugali, pizza, and omelettes.

Heat
Serious. Start with a single drop, then decide.

Pack
125ml glass with dropper cap. Packed with a cardboard sleeve so the bottle survives moto delivery.

Storage
Room temperature, away from sun. Shake gently; sediment is normal.`,
    price: 3500,
    tags: ['grocery', 'chili', 'local'],
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1506368245909-5595e0d86dd4?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '5.00',
    ratingCount: 120,
    salesCount: 540,
    variants: [{ sku: 'LOC-AKA-125', name: '125ml', attrs: { size: '125ml' }, stock: 80 }],
  },
  {
    storeSlug: 'kimironko-harvest',
    categorySlug: 'local-products',
    brandName: 'Thousand Hills',
    brandSlug: 'thousand-hills',
    name: 'Nyungwe Wild Honey 500g',
    slug: 'nyungwe-wild-honey-500g',
    sku: 'LOC-HON',
    shortDescription: 'Raw forest honey from hives near Nyungwe — unfiltered, 500g jar.',
    description: `Raw honey with pollen specks intact. Not pasteurised.

Taste
Floral, slightly woody. Crystallises in cool rooms — stand the jar in warm water, never boil.

Sourcing
We buy from beekeeper groups on the Nyungwe edge. Each lid batch code maps to a collection week.

Use
Tea, yogurt, roasted groundnuts, or a spoon as-is.`,
    price: 8500,
    discountPrice: 7500,
    tags: ['local', 'honey', 'grocery'],
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.80',
    ratingCount: 45,
    salesCount: 98,
    variants: [{ sku: 'LOC-HON-500', name: '500g', attrs: { size: '500g' }, stock: 42 }],
  },
  {
    storeSlug: 'kimironko-harvest',
    categorySlug: 'grocery',
    brandName: 'Thousand Hills',
    brandSlug: 'thousand-hills',
    name: 'Dried Pineapple Pack 200g',
    slug: 'dried-pineapple-pack',
    sku: 'LOC-PIN',
    shortDescription: 'Sun-dried pineapple rings, no added sugar — 200g resealable pack.',
    description: `Chewy pineapple from Eastern Province fruit, sliced and dried without sulphur.

Ingredients
Pineapple. That’s it.

Snack
School lunch, road trips to Musanze, or chopped into granola.

Keep sealed. Once opened, finish within two weeks or refrigerate.`,
    price: 4200,
    tags: ['grocery', 'snacks', 'fruit'],
    images: [
      'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.50',
    ratingCount: 19,
    salesCount: 63,
    variants: [{ sku: 'LOC-PIN-200', name: '200g', attrs: { size: '200g' }, stock: 55 }],
  },
  {
    storeSlug: 'gasabo-living',
    categorySlug: 'home-living',
    brandName: 'Gasabo Atelier',
    brandSlug: 'gasabo-atelier',
    name: 'Imigongo Wall Panel',
    slug: 'imigongo-wall-panel',
    sku: 'HOM-IMI',
    shortDescription: 'Traditional geometric imigongo panel, 40×40cm, ready to hang.',
    description: `A contemporary imigongo piece from a Remera studio.

Craft
Cow-dung base (the traditional method), painted in black, white, and cream geometrics. Sealed for indoor walls.

Size
40×40cm, 2.5cm deep. Sawtooth hanger on the reverse.

Place it
Above a sofa, in a stair landing, or as a set of three (message the seller for a triptych).

Not for steamy bathrooms. Dust with a dry cloth only.`,
    price: 55000,
    tags: ['home', 'imigongo', 'art', 'local'],
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.90',
    ratingCount: 14,
    salesCount: 22,
    variants: [
      { sku: 'HOM-IMI-BW', name: 'Black & cream', attrs: { palette: 'Black & cream' }, stock: 6 },
      { sku: 'HOM-IMI-RD', name: 'Red accent', attrs: { palette: 'Red accent' }, stock: 4 },
    ],
  },
  {
    storeSlug: 'gasabo-living',
    categorySlug: 'local-products',
    brandName: 'Gasabo Atelier',
    brandSlug: 'gasabo-atelier',
    name: 'Woven Agaseke Basket',
    slug: 'woven-agaseke-basket',
    sku: 'HOM-AGA',
    shortDescription: 'Lidded agaseke in sisal and sweetgrass — medium, gift-ready.',
    description: `A lidded peace basket woven in sisal with a sweetgrass core.

Use
Bread, jewelry, or as a gift empty. The lid sits snug.

Colorways
Natural with black zig-zag, or natural with teal. Each weaver signs a small cloth tag inside.

Diameter
Medium: about 22cm. Hand measurements vary by 1cm — that’s the craft, not a defect.`,
    price: 18000,
    discountPrice: 15500,
    tags: ['local', 'basket', 'home'],
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f1fdf1dba?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.70',
    ratingCount: 26,
    salesCount: 58,
    variants: [
      { sku: 'HOM-AGA-NAT', name: 'Natural / black', attrs: { color: 'Natural / black' }, stock: 14 },
      { sku: 'HOM-AGA-TEAL', name: 'Natural / teal', attrs: { color: 'Natural / teal' }, stock: 9 },
    ],
  },
  {
    storeSlug: 'gasabo-living',
    categorySlug: 'furniture',
    brandName: 'Gasabo Atelier',
    brandSlug: 'gasabo-atelier',
    name: 'Teak Side Table',
    slug: 'teak-side-table',
    sku: 'HOM-TBL',
    shortDescription: 'Compact teak side table, 45cm high — apartment-friendly.',
    description: `A round teak-look side table for laptops, lamps, and evening tea.

Specs
• Height 45cm, top diameter 40cm
• Solid-wood legs, veneered top
• Natural oil finish

Delivery
Kigali city: assembled. Outside Kigali: ships flat with an Allen key and a one-page guide.

Care
Wipe spills quickly. Re-oil once a year if the top looks dry.`,
    price: 72000,
    discountPrice: 64000,
    tags: ['furniture', 'table', 'home'],
    images: [
      'https://images.unsplash.com/photo-1532372320572-c8ca078e9a60?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.40',
    ratingCount: 11,
    salesCount: 17,
    variants: [{ sku: 'HOM-TBL-NAT', name: 'Natural teak', attrs: { finish: 'Natural teak' }, stock: 5 }],
  },
  {
    storeSlug: 'gasabo-living',
    categorySlug: 'home-living',
    brandName: 'Gasabo Atelier',
    brandSlug: 'gasabo-atelier',
    name: 'Cotton Duvet Set (Queen)',
    slug: 'cotton-duvet-set-queen',
    sku: 'HOM-DUV',
    shortDescription: 'Queen cotton duvet cover with two pillowcases — washed and packed in Remera.',
    description: `A breathable cotton set for Kigali nights that swing from cool to warm.

Includes
1 queen duvet cover, 2 pillowcases. Buttons at the foot. No insert.

Fabric
200-thread-count cotton. Gets softer after the third wash.

Colors
Bone, sage, or midnight. We photograph in daylight — sage reads greyer at night.

Wash
Cool cycle, line dry. Iron on reverse if you like a crisp hotel look.`,
    price: 34000,
    discountPrice: 29900,
    tags: ['home', 'bedding', 'cotton'],
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.60',
    ratingCount: 23,
    salesCount: 49,
    variants: [
      { sku: 'HOM-DUV-BONE', name: 'Bone', attrs: { color: 'Bone' }, stock: 10 },
      { sku: 'HOM-DUV-SAGE', name: 'Sage', attrs: { color: 'Sage' }, stock: 8 },
      { sku: 'HOM-DUV-MID', name: 'Midnight', attrs: { color: 'Midnight' }, stock: 6 },
    ],
  },
  {
    storeSlug: 'downtown-fashion-kigali',
    categorySlug: 'accessories',
    brandName: 'Kigali Wear',
    brandSlug: 'kigali-wear',
    name: 'Beaded Statement Earrings',
    slug: 'beaded-statement-earrings',
    sku: 'ACC-EAR',
    shortDescription: 'Lightweight beaded drops — nickel-free hooks, gift box included.',
    description: `Handmade beaded earrings from a downtown maker collective.

Wear
Light enough for all-day office use. Hooks are nickel-free.

Colors
Royal blue / cream, or terracotta / black.

Gift
Ships in a small kraft box with tissue — ready for birthdays without extra wrapping.`,
    price: 7500,
    tags: ['accessories', 'earrings', 'handmade'],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.80',
    ratingCount: 31,
    salesCount: 90,
    variants: [
      { sku: 'ACC-EAR-BLU', name: 'Royal blue', attrs: { color: 'Royal blue' }, stock: 20 },
      { sku: 'ACC-EAR-TER', name: 'Terracotta', attrs: { color: 'Terracotta' }, stock: 16 },
    ],
  },
  {
    storeSlug: 'kigali-gadget-hub',
    categorySlug: 'office',
    brandName: 'Horizon Mobile',
    brandSlug: 'horizon-mobile',
    name: 'Laptop Stand & Desk Mat Bundle',
    slug: 'laptop-stand-desk-mat',
    sku: 'OFF-DESK',
    shortDescription: 'Aluminum laptop stand plus a large desk mat for home offices.',
    description: `A two-piece desk kit for Kacyiru and home-office setups.

Stand
Aluminum, six angles, fits 11–16" laptops. Folds flat in a bag.

Mat
80×40cm, stitched edges, waterproof top. Mouse works on the whole surface.

Why together
Buying them as a bundle saves versus two separate listings, and we pack them in one box for one delivery fee.`,
    price: 29500,
    discountPrice: 24900,
    tags: ['office', 'desk', 'laptop'],
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80',
    ],
    ratingAvg: '4.50',
    ratingCount: 12,
    salesCount: 28,
    variants: [
      { sku: 'OFF-DESK-GRY', name: 'Grey mat', attrs: { mat: 'Grey' }, stock: 11 },
      { sku: 'OFF-DESK-BLK', name: 'Black mat', attrs: { mat: 'Black' }, stock: 9 },
    ],
  },
];
