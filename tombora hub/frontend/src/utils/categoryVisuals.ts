export type CategoryVisual = {
  image: string;
  tone: string;
};

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  fashion: {
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
    tone: '#db2777',
  },
  electronics: {
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    tone: '#0d9488',
  },
  phones: {
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    tone: '#2563eb',
  },
  beauty: {
    image:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    tone: '#c026a8',
  },
  'home-living': {
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    tone: '#ca8a04',
  },
  shoes: {
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    tone: '#e85d04',
  },
  bags: {
    image:
      'https://images.unsplash.com/photo-1590874103328-eac38a941278?auto=format&fit=crop&w=800&q=80',
    tone: '#7c3aed',
  },
  'baby-products': {
    image:
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80',
    tone: '#0891b2',
  },
  grocery: {
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    tone: '#16a34a',
  },
  sports: {
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066027b?auto=format&fit=crop&w=800&q=80',
    tone: '#ea580c',
  },
  automotive: {
    image:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    tone: '#334155',
  },
  accessories: {
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
    tone: '#d97706',
  },
  furniture: {
    image:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    tone: '#b45309',
  },
  office: {
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    tone: '#475569',
  },
  'local-products': {
    image:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    tone: '#e85d04',
  },
};

export const FALLBACK_CATEGORY_VISUAL: CategoryVisual = {
  image:
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
  tone: '#e85d04',
};

export function categoryImage(slug: string, imageUrl?: string | null) {
  if (imageUrl) return imageUrl;
  return CATEGORY_VISUALS[slug]?.image ?? FALLBACK_CATEGORY_VISUAL.image;
}

export function categoryTone(slug: string) {
  return CATEGORY_VISUALS[slug]?.tone ?? FALLBACK_CATEGORY_VISUAL.tone;
}

export type CategoryTileItem = {
  name: string;
  image: string;
  href: string;
};

export const CATEGORY_TILES: Record<string, Array<{ name: string; image: string }>> = {
  fashion: [
    { name: "Women's wear", image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80' },
    { name: "Men's shirts", image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80' },
    { name: 'Traditional wear', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80' },
    { name: 'Everyday casual', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  ],
  electronics: [
    { name: 'Bluetooth audio', image: 'https://images.unsplash.com/photo-1608043152269-423dbbaed06b?auto=format&fit=crop&w=600&q=80' },
    { name: 'Fast power banks', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80' },
    { name: 'Wireless earbuds', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80' },
    { name: 'Cables & chargers', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80' },
  ],
  phones: [
    { name: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80' },
    { name: 'Protective cases', image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80' },
    { name: 'Fast chargers', image: 'https://images.unsplash.com/photo-1622445262464-84b25e40a6b6?auto=format&fit=crop&w=600&q=80' },
    { name: 'Earphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' },
  ],
  beauty: [
    { name: 'Face serums', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80' },
    { name: 'Shea body butter', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80' },
    { name: 'Hair styling', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
    { name: 'Facial oils', image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
  ],
  'home-living': [
    { name: 'Bedding & sheets', image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=600&q=80' },
    { name: 'Imigongo wall art', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80' },
    { name: 'Living cushions', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Tableware', image: 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?auto=format&fit=crop&w=600&q=80' },
  ],
  shoes: [
    { name: 'Kigali sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
    { name: 'Casual loafers', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80' },
    { name: 'Sandals', image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=600&q=80' },
    { name: 'Formal shoes', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80' },
  ],
  bags: [
    { name: 'Crossbody bags', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80' },
    { name: 'Market totes', image: 'https://images.unsplash.com/photo-1590874103328-eac38a941278?auto=format&fit=crop&w=600&q=80' },
    { name: 'Backpacks', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
    { name: 'Travel pouches', image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=600&q=80' },
  ],
  'baby-products': [
    { name: 'Baby clothing', image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80' },
    { name: 'Feeding & bottles', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80' },
    { name: 'Baby blankets', image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=600&q=80' },
    { name: 'Care essentials', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80' },
  ],
  grocery: [
    { name: 'Akabanga chili', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80' },
    { name: 'Dried pineapples', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
    { name: 'Pantry grains', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
    { name: 'Roasted snacks', image: 'https://images.unsplash.com/photo-1536599424071-0b215a388ba7?auto=format&fit=crop&w=600&q=80' },
  ],
  sports: [
    { name: 'Football gear', image: 'https://images.unsplash.com/photo-1517649763962-0c623066027b?auto=format&fit=crop&w=600&q=80' },
    { name: 'Training apparel', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80' },
    { name: 'Water bottles', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80' },
    { name: 'Gym accessories', image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80' },
  ],
  automotive: [
    { name: 'Car care kits', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80' },
    { name: 'Phone car mounts', image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80' },
    { name: 'Cabin care', image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80' },
    { name: 'Road accessories', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80' },
  ],
  accessories: [
    { name: 'Beaded earrings', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80' },
    { name: 'Watches', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80' },
    { name: 'Earrings & cuffs', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80' },
    { name: 'Belts & bands', image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80' },
  ],
  furniture: [
    { name: 'Teak side table', image: 'https://images.unsplash.com/photo-1532372998445-5f6e9196b052?auto=format&fit=crop&w=600&q=80' },
    { name: 'Living stools', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80' },
    { name: 'Coffee tables', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
    { name: 'Handmade decor', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80' },
  ],
  office: [
    { name: 'Desk mat bundle', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=600&q=80' },
    { name: 'Laptop stands', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80' },
    { name: 'Desk lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80' },
    { name: 'Startup supplies', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80' },
  ],
  'local-products': [
    { name: 'Agaseke baskets', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80' },
    { name: 'Rwandan coffee', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
    { name: 'Nyungwe wild honey', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80' },
    { name: 'Chili & preserves', image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80' },
  ],
};

export function getCategoryQuadTiles(
  slug: string,
  categoryProducts: Array<{ name: string; slug: string; imageUrl?: string | null }> = [],
): CategoryTileItem[] {
  const result: CategoryTileItem[] = [];

  // Prioritize actual products matching this category
  for (const p of categoryProducts) {
    result.push({
      name: p.name,
      image: p.imageUrl || categoryImage(slug),
      href: `/products/${p.slug}`,
    });
    if (result.length >= 4) break;
  }

  // Fill remaining slots with curated subcategory visual tiles
  const curated = CATEGORY_TILES[slug] || [];
  for (const c of curated) {
    if (result.length >= 4) break;
    if (!result.some((r) => r.name.toLowerCase() === c.name.toLowerCase())) {
      result.push({
        name: c.name,
        image: c.image,
        href: `/categories/${slug}`,
      });
    }
  }

  // Fallback if needed
  while (result.length < 4) {
    result.push({
      name: 'Shop category',
      image: categoryImage(slug),
      href: `/categories/${slug}`,
    });
  }

  return result.slice(0, 4);
}
