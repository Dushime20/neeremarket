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
