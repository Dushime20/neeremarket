export type StockAxis = {
  key: string;
  name: string;
  values: string[];
};

export type StockCombo = {
  key: string;
  attributes: Record<string, string>;
  stock: string;
  sku: string;
  available: boolean;
  variantId?: string;
};

export type SavedStockVariant = {
  id: string;
  sku?: string;
  attributes?: Record<string, string> | null;
  isActive?: boolean;
  inventory?: { quantity: number } | null;
};

export const MAX_STOCK_LINES = 80;
export const MAX_ATTRIBUTES = 8;

type AttributeDef = {
  name: string;
  placeholder: string;
  suggestions: string[];
};

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const BABY_SIZES = ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years'];

export const ATTRIBUTE_LIBRARY: AttributeDef[] = [
  {
    name: 'Model',
    placeholder: 'Galaxy A15, ThinkPad E14',
    suggestions: [],
  },
  {
    name: 'Generation',
    placeholder: '12th Gen',
    suggestions: ['10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'],
  },
  {
    name: 'Version',
    placeholder: 'i5, Pro, Standard',
    suggestions: ['Standard', 'Pro', 'Plus', 'i3', 'i5', 'i7', 'i9', 'Ryzen 5', 'Ryzen 7'],
  },
  {
    name: 'Color',
    placeholder: 'Black',
    suggestions: ['Black', 'White', 'Navy', 'Grey', 'Brown', 'Beige', 'Red', 'Blue', 'Green', 'Gold', 'Silver'],
  },
  {
    name: 'Size',
    placeholder: 'M or 42',
    suggestions: APPAREL_SIZES,
  },
  {
    name: 'Storage',
    placeholder: '256 GB',
    suggestions: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
  },
  {
    name: 'RAM',
    placeholder: '8 GB',
    suggestions: ['4 GB', '8 GB', '16 GB', '32 GB'],
  },
  {
    name: 'Screen size',
    placeholder: '15.6 inch',
    suggestions: ['6.1 inch', '6.7 inch', '13 inch', '14 inch', '15.6 inch', '27 inch'],
  },
  {
    name: 'Material',
    placeholder: 'Cotton, leather',
    suggestions: ['Cotton', 'Linen', 'Polyester', 'Denim', 'Leather', 'Wood', 'Metal', 'Plastic'],
  },
  {
    name: 'Fit',
    placeholder: 'Regular',
    suggestions: ['Slim', 'Regular', 'Relaxed', 'Oversized'],
  },
  {
    name: 'Length',
    placeholder: 'Midi',
    suggestions: ['Mini', 'Knee', 'Midi', 'Maxi'],
  },
  {
    name: 'Width',
    placeholder: 'Regular',
    suggestions: ['Narrow', 'Regular', 'Wide'],
  },
  {
    name: 'Heel height',
    placeholder: 'Flat',
    suggestions: ['Flat', '3 cm', '6 cm', '9 cm'],
  },
  {
    name: 'Pattern',
    placeholder: 'Solid',
    suggestions: ['Solid', 'Striped', 'Printed', 'Floral'],
  },
  {
    name: 'Style',
    placeholder: 'Casual',
    suggestions: ['Casual', 'Formal', 'Sport', 'Traditional'],
  },
  {
    name: 'Shade',
    placeholder: 'Warm beige',
    suggestions: [],
  },
  {
    name: 'Volume',
    placeholder: '50 ml',
    suggestions: ['30 ml', '50 ml', '100 ml', '250 ml', '500 ml', '1 L'],
  },
  {
    name: 'Scent',
    placeholder: 'Unscented',
    suggestions: ['Unscented', 'Vanilla', 'Citrus', 'Floral', 'Woody'],
  },
  {
    name: 'Finish',
    placeholder: 'Matte',
    suggestions: ['Matte', 'Gloss', 'Natural', 'Walnut', 'White'],
  },
  {
    name: 'Pack size',
    placeholder: '500 g',
    suggestions: ['1 pc', '100 g', '250 g', '500 g', '1 kg', 'Box of 6', 'Box of 12'],
  },
  {
    name: 'Flavor',
    placeholder: 'Original',
    suggestions: ['Original', 'Vanilla', 'Honey', 'Chili'],
  },
  {
    name: 'Grade',
    placeholder: 'Premium',
    suggestions: ['Standard', 'Premium', 'Grade A'],
  },
  {
    name: 'Capacity',
    placeholder: '10000 mAh',
    suggestions: ['5000 mAh', '10000 mAh', '20000 mAh'],
  },
  {
    name: 'Wattage',
    placeholder: '45W',
    suggestions: ['20W', '45W', '65W', '100W'],
  },
  {
    name: 'Connectivity',
    placeholder: 'Bluetooth',
    suggestions: ['Wired', 'Bluetooth', 'Wi-Fi', 'USB-C'],
  },
  {
    name: 'Compatibility',
    placeholder: 'USB-C',
    suggestions: ['Universal', 'USB-C', 'Lightning', 'Android', 'Windows'],
  },
  {
    name: 'Age',
    placeholder: '3-6 months',
    suggestions: BABY_SIZES,
  },
  {
    name: 'Condition grade',
    placeholder: 'Open box',
    suggestions: ['New', 'Open box', 'Refurbished'],
  },
  {
    name: 'Year',
    placeholder: '2024',
    suggestions: [],
  },
  {
    name: 'Socket',
    placeholder: 'AM5',
    suggestions: ['LGA1700', 'AM4', 'AM5'],
  },
];

const STARTING: Record<string, string[]> = {
  fashion: ['Color', 'Size'],
  shoes: ['Color', 'Size'],
  'electronics-laptops': ['Model', 'Generation', 'Version', 'RAM', 'Storage'],
  'electronics-gaming': ['Model', 'Version', 'Storage'],
  'electronics-tv': ['Model', 'Screen size'],
  electronics: ['Model', 'Color'],
  'phones-smartphones': ['Model', 'Color', 'Storage', 'RAM'],
  phones: ['Model', 'Color'],
  beauty: ['Shade', 'Volume'],
  'beauty-fragrance': ['Scent', 'Volume'],
  grocery: ['Pack size', 'Flavor'],
  'local-products': ['Pack size', 'Grade'],
  furniture: ['Finish', 'Material'],
  bags: ['Color', 'Material'],
  accessories: ['Color', 'Material'],
  'baby-products': ['Color', 'Size', 'Age'],
  'baby-clothing': ['Color', 'Size', 'Age'],
  sports: ['Color', 'Size'],
  automotive: ['Model', 'Compatibility'],
  office: ['Color', 'Pack size'],
  'home-living': ['Color', 'Material'],
};

const RECOMMENDED_EXTRA: Record<string, string[]> = {
  fashion: ['Model', 'Fit', 'Material', 'Length', 'Pattern', 'Style'],
  shoes: ['Model', 'Width', 'Material', 'Heel height', 'Style'],
  electronics: ['Generation', 'Version', 'Color', 'RAM', 'Storage', 'Screen size', 'Condition grade'],
  phones: ['Version', 'Storage', 'RAM', 'Condition grade'],
  beauty: ['Scent', 'Shade', 'Finish', 'Volume'],
  grocery: ['Flavor', 'Grade', 'Pack size'],
  furniture: ['Color', 'Size', 'Material', 'Finish'],
  bags: ['Size', 'Color', 'Style'],
  'baby-products': ['Color', 'Size', 'Age', 'Material'],
  sports: ['Size', 'Color', 'Model'],
  automotive: ['Model', 'Year', 'Compatibility'],
  accessories: ['Size', 'Color', 'Material', 'Style'],
  'home-living': ['Size', 'Color', 'Material', 'Finish'],
  office: ['Model', 'Color', 'Pack size'],
  'local-products': ['Pack size', 'Grade', 'Flavor'],
};

export function stockKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function skuSlug(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
}

function libraryItem(name: string) {
  const key = name.trim().toLowerCase();
  return ATTRIBUTE_LIBRARY.find((item) => item.name.toLowerCase() === key);
}

export function placeholderFor(name: string) {
  return libraryItem(name)?.placeholder || 'Value';
}

export function suggestionsFor(name: string, parentSlug?: string | null, subSlug?: string | null) {
  const key = name.trim().toLowerCase();
  if (key === 'size') {
    if (parentSlug === 'shoes' || subSlug?.startsWith('shoes')) return SHOE_SIZES;
    if (parentSlug === 'baby-products' || subSlug?.startsWith('baby')) return BABY_SIZES;
    return APPAREL_SIZES;
  }
  return libraryItem(name)?.suggestions || [];
}

export function startingAttributeNames(parentSlug?: string | null, subSlug?: string | null) {
  if (subSlug && STARTING[subSlug]) return STARTING[subSlug];
  if (parentSlug && STARTING[parentSlug]) return STARTING[parentSlug];
  return [];
}

export function recommendedAttributeNames(parentSlug?: string | null, subSlug?: string | null) {
  const names = [
    ...startingAttributeNames(parentSlug, subSlug),
    ...(subSlug && RECOMMENDED_EXTRA[subSlug] ? RECOMMENDED_EXTRA[subSlug] : []),
    ...(parentSlug && RECOMMENDED_EXTRA[parentSlug] ? RECOMMENDED_EXTRA[parentSlug] : []),
    ...ATTRIBUTE_LIBRARY.map((item) => item.name),
  ];
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function axesFromNames(names: string[]): StockAxis[] {
  return names.map((name) => ({ key: stockKey(), name, values: [] }));
}

export function blankCombo(): StockCombo {
  return { key: stockKey(), attributes: {}, stock: '10', sku: '', available: true };
}

function cleanValues(values: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    next.push(trimmed);
  }
  return next;
}

export function activeAxes(axes: StockAxis[]) {
  return axes
    .map((axis) => ({ name: axis.name.trim(), values: cleanValues(axis.values) }))
    .filter((axis) => axis.name && axis.values.length);
}

export function combinationCount(axes: StockAxis[]) {
  const axesWithValues = activeAxes(axes);
  if (!axesWithValues.length) return 1;
  let count = 1;
  for (const axis of axesWithValues) {
    count *= axis.values.length;
    if (count > MAX_STOCK_LINES) return count;
  }
  return count;
}

export function attributeSignature(attributes: Record<string, string> | null | undefined) {
  return Object.entries(attributes || {})
    .map(([key, value]) => [key.trim().toLowerCase(), String(value ?? '').trim().toLowerCase()] as const)
    .filter(([key, value]) => key && value && !(key === 'type' && value === 'standard'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('|');
}

export function buildCombos(axes: StockAxis[], previous: StockCombo[]) {
  const axesWithValues = activeAxes(axes).slice(0, MAX_ATTRIBUTES);
  let partials: Record<string, string>[] = [{}];
  let overflow = false;

  if (axesWithValues.length) {
    partials = [];
    const walk = (index: number, current: Record<string, string>) => {
      if (overflow) return;
      if (index >= axesWithValues.length) {
        if (partials.length >= MAX_STOCK_LINES) {
          overflow = true;
          return;
        }
        partials.push(current);
        return;
      }
      const axis = axesWithValues[index];
      for (const value of axis.values) {
        walk(index + 1, { ...current, [axis.name]: value });
        if (overflow) return;
      }
    };
    walk(0, {});
  }

  const combos = partials.map((attributes) => {
    const signature = attributeSignature(attributes);
    const prev = previous.find((combo) => attributeSignature(combo.attributes) === signature);
    return {
      key: prev?.key || stockKey(),
      attributes,
      stock: prev?.stock ?? '10',
      sku: prev?.sku ?? '',
      available: prev?.available ?? true,
      variantId: prev?.variantId,
    };
  });

  return { combos, overflow };
}

export function duplicateAxisName(axes: StockAxis[]) {
  const seen = new Set<string>();
  for (const axis of axes) {
    const name = axis.name.trim().toLowerCase();
    if (!name) continue;
    if (seen.has(name)) return axis.name.trim();
    seen.add(name);
  }
  return null;
}

function meaningfulEntries(attributes: Record<string, string>) {
  return Object.entries(attributes).filter(([key, value]) => {
    const name = key.trim();
    const next = value.trim();
    if (!name || !next) return false;
    return !(name.toLowerCase() === 'type' && next.toLowerCase() === 'standard');
  });
}

export function stockFromVariants(variants: SavedStockVariant[]) {
  const order: string[] = [];
  const values = new Map<string, string[]>();
  const display = new Map<string, string>();

  for (const variant of variants) {
    for (const [key, value] of meaningfulEntries(variant.attributes || {})) {
      const id = key.trim().toLowerCase();
      if (!display.has(id)) {
        display.set(id, key.trim());
        order.push(id);
        values.set(id, []);
      }
      const list = values.get(id) || [];
      if (!list.some((item) => item.toLowerCase() === value.trim().toLowerCase())) {
        list.push(value.trim());
        values.set(id, list);
      }
    }
  }

  const axes: StockAxis[] = order.map((id) => ({
    key: stockKey(),
    name: display.get(id) || id,
    values: values.get(id) || [],
  }));

  const combos: StockCombo[] = (variants.length ? variants : [null]).map((variant) => {
    const attributes: Record<string, string> = {};
    if (variant) {
      for (const [key, value] of meaningfulEntries(variant.attributes || {})) {
        const id = key.trim().toLowerCase();
        attributes[display.get(id) || key.trim()] = value.trim();
      }
    }
    return {
      key: stockKey(),
      attributes,
      stock: String(variant?.inventory?.quantity ?? 10),
      sku: variant?.sku || '',
      available: variant ? variant.isActive !== false : true,
      variantId: variant?.id,
    };
  });

  return { axes, combos };
}

export function toVariantPayload(
  axes: StockAxis[],
  combos: StockCombo[],
  opts: { productName: string; price: number; stamp: string },
) {
  const axesWithValues = activeAxes(axes);
  return combos.map((combo, index) => {
    const attributes: Record<string, string> = {};
    if (axesWithValues.length) {
      for (const axis of axesWithValues) {
        const direct = combo.attributes[axis.name];
        const fallback = Object.entries(combo.attributes).find(
          ([key]) => key.toLowerCase() === axis.name.toLowerCase(),
        )?.[1];
        const value = (direct || fallback || '').trim();
        if (value) attributes[axis.name] = value;
      }
    }
    if (!Object.keys(attributes).length) attributes.type = 'Standard';
    const label =
      Object.values(attributes)
        .filter((value) => value.toLowerCase() !== 'standard')
        .join(' / ') || 'Default';
    return {
      ...(combo.variantId ? { id: combo.variantId } : {}),
      sku:
        combo.sku.trim() ||
        `${skuSlug(opts.productName) || 'SKU'}-${skuSlug(label) || index + 1}-${opts.stamp}`,
      name: label,
      attributes,
      price: opts.price,
      stock: Math.max(0, Math.floor(Number(combo.stock) || 0)),
      isActive: combo.available,
    };
  });
}
