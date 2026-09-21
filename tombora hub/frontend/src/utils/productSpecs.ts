export type SpecFieldDef = {
  name: string;
  placeholder: string;
  hint?: string;
  required?: boolean;
  type?: 'text' | 'select' | 'number';
  options?: string[];
};

export type VariantKind = 'apparel' | 'device' | 'pack' | 'generic';

const COMMON_ORIGIN: SpecFieldDef = {
  name: 'Country of origin',
  placeholder: 'Rwanda, China, Kenya…',
};

const PARENT_SPECS: Record<string, SpecFieldDef[]> = {
  fashion: [
    { name: 'Brand', placeholder: 'Local tailor, Nike, no brand…', required: true },
    {
      name: 'Gender',
      placeholder: 'Women',
      type: 'select',
      options: ['Women', 'Men', 'Unisex', 'Kids'],
      required: true,
    },
    { name: 'Material', placeholder: 'Cotton, polyester, linen…', required: true },
    { name: 'Fabric type', placeholder: 'Jersey, denim, knit' },
    { name: 'Fit', placeholder: 'Regular', type: 'select', options: ['Slim', 'Regular', 'Relaxed', 'Oversized'] },
    { name: 'Care instructions', placeholder: 'Machine wash cold' },
    COMMON_ORIGIN,
  ],
  electronics: [
    { name: 'Brand', placeholder: 'Samsung, Tecno, Hisense…', required: true },
    { name: 'Model', placeholder: 'Model or series name', required: true },
    { name: 'Warranty', placeholder: '12 months' },
    { name: 'Power', placeholder: '220V, battery, USB-C' },
    { name: 'Connectivity', placeholder: 'Wi-Fi, Bluetooth, HDMI' },
    { name: 'What’s in the box', placeholder: 'Device, charger, manual' },
    COMMON_ORIGIN,
  ],
  phones: [
    { name: 'Brand', placeholder: 'Samsung, Tecno, iPhone…', required: true },
    { name: 'Model', placeholder: 'Galaxy A15, Spark 20…', required: true },
    { name: 'Storage', placeholder: '128 GB', required: true },
    { name: 'RAM', placeholder: '6 GB' },
    { name: 'Screen size', placeholder: '6.6 inch' },
    { name: 'Battery', placeholder: '5000 mAh' },
    { name: 'Warranty', placeholder: '12 months' },
    COMMON_ORIGIN,
  ],
  beauty: [
    { name: 'Brand', placeholder: 'Nivea, local brand…', required: true },
    { name: 'Volume / weight', placeholder: '200 ml, 50 g', required: true },
    {
      name: 'Skin / hair type',
      placeholder: 'All skin types',
      type: 'select',
      options: ['All types', 'Dry', 'Oily', 'Combination', 'Sensitive', 'Color-treated'],
    },
    { name: 'Key ingredients', placeholder: 'Shea butter, vitamin C' },
    { name: 'Expiry / PAO', placeholder: '24 months after opening' },
    { name: 'Scent', placeholder: 'Unscented, coconut' },
    COMMON_ORIGIN,
  ],
  'home-living': [
    { name: 'Brand', placeholder: 'Brand or artisan name' },
    { name: 'Material', placeholder: 'Wood, cotton, ceramic', required: true },
    { name: 'Color', placeholder: 'Natural, white, navy' },
    { name: 'Room', placeholder: 'Living room, kitchen' },
    { name: 'Care', placeholder: 'Wipe clean, hand wash' },
    COMMON_ORIGIN,
  ],
  shoes: [
    { name: 'Brand', placeholder: 'Brand or maker', required: true },
    {
      name: 'Gender',
      placeholder: 'Unisex',
      type: 'select',
      options: ['Women', 'Men', 'Unisex', 'Kids'],
      required: true,
    },
    { name: 'Upper material', placeholder: 'Leather, mesh, canvas', required: true },
    { name: 'Sole', placeholder: 'Rubber, EVA' },
    { name: 'Closure', placeholder: 'Laces, slip-on, buckle' },
    COMMON_ORIGIN,
  ],
  bags: [
    { name: 'Brand', placeholder: 'Brand or maker' },
    { name: 'Material', placeholder: 'Leather, canvas, nylon', required: true },
    { name: 'Closure', placeholder: 'Zipper, magnetic snap' },
    { name: 'Compartments', placeholder: '1 main + 2 pockets' },
    { name: 'Strap type', placeholder: 'Shoulder, crossbody, handles' },
    COMMON_ORIGIN,
  ],
  'baby-products': [
    { name: 'Brand', placeholder: 'Brand name' },
    { name: 'Age range', placeholder: '0–12 months', required: true },
    { name: 'Material', placeholder: 'Organic cotton, BPA-free plastic' },
    { name: 'Safety notes', placeholder: 'Choking hazard age, certifications' },
    COMMON_ORIGIN,
  ],
  grocery: [
    { name: 'Brand', placeholder: 'Brand or farm name' },
    { name: 'Net weight', placeholder: '500 g, 1 L', required: true },
    { name: 'Ingredients', placeholder: 'Main ingredients' },
    { name: 'Expiry date', placeholder: 'Best before…' },
    { name: 'Storage', placeholder: 'Keep cool and dry' },
    COMMON_ORIGIN,
  ],
  sports: [
    { name: 'Brand', placeholder: 'Brand name' },
    { name: 'Sport', placeholder: 'Football, running, gym', required: true },
    { name: 'Size / weight', placeholder: 'Size 5, 5 kg' },
    { name: 'Material', placeholder: 'Polyester, rubber' },
    { name: 'Level', placeholder: 'Beginner, match, training' },
    COMMON_ORIGIN,
  ],
  automotive: [
    { name: 'Brand', placeholder: 'Brand name' },
    { name: 'Vehicle fit', placeholder: 'Universal, Toyota, motorbike', required: true },
    { name: 'Part type', placeholder: 'Interior, care, fluid' },
    { name: 'Volume / size', placeholder: '500 ml, 10 inch' },
    COMMON_ORIGIN,
  ],
  accessories: [
    { name: 'Brand', placeholder: 'Brand or maker' },
    { name: 'Material', placeholder: 'Gold-plated, leather, cotton', required: true },
    { name: 'Color', placeholder: 'Gold, black' },
    { name: 'Size', placeholder: 'Adjustable, 42 mm' },
    COMMON_ORIGIN,
  ],
  furniture: [
    { name: 'Material', placeholder: 'Pine, metal, rattan', required: true },
    { name: 'Color / finish', placeholder: 'Natural oak, matte black' },
    { name: 'Assembly', placeholder: 'Flat-pack, ready to use' },
    { name: 'Seating / capacity', placeholder: '2-seater, 4 people' },
    { name: 'Care', placeholder: 'Dust, oil wood yearly' },
    COMMON_ORIGIN,
  ],
  office: [
    { name: 'Brand', placeholder: 'Brand name' },
    { name: 'Type', placeholder: 'Notebook, ink, stapler', required: true },
    { name: 'Size / count', placeholder: 'A4, 50 sheets, 10-pack' },
    { name: 'Color', placeholder: 'Black, blue' },
    COMMON_ORIGIN,
  ],
  'local-products': [
    { name: 'Producer', placeholder: 'Co-op, farm, artisan', required: true },
    { name: 'Net weight', placeholder: '250 g, 500 ml' },
    { name: 'Ingredients', placeholder: 'What it is made from' },
    { name: 'Region', placeholder: 'Musanze, Huye, Kigali' },
    { name: 'Storage', placeholder: 'Cool, dry place' },
    COMMON_ORIGIN,
  ],
};

const SUB_SPECS: Record<string, SpecFieldDef[]> = {
  'electronics-laptops': [
    { name: 'Brand', placeholder: 'HP, Lenovo, Dell…', required: true },
    { name: 'Model', placeholder: 'IdeaPad 3, Inspiron 15', required: true },
    { name: 'Processor', placeholder: 'Intel i5, Ryzen 5', required: true },
    { name: 'RAM', placeholder: '8 GB' },
    { name: 'Storage', placeholder: '512 GB SSD' },
    { name: 'Screen size', placeholder: '15.6 inch' },
    { name: 'Operating system', placeholder: 'Windows 11' },
    { name: 'Warranty', placeholder: '12 months' },
  ],
  'electronics-tv': [
    { name: 'Brand', placeholder: 'Hisense, Samsung…', required: true },
    { name: 'Screen size', placeholder: '43 inch', required: true },
    { name: 'Resolution', placeholder: '4K UHD' },
    { name: 'Smart TV', placeholder: 'Yes / Android TV' },
    { name: 'Warranty', placeholder: '24 months' },
  ],
  'electronics-audio': [
    { name: 'Brand', placeholder: 'JBL, Oraimo…', required: true },
    { name: 'Type', placeholder: 'Speaker, headphones, soundbar', required: true },
    { name: 'Connectivity', placeholder: 'Bluetooth, aux, USB' },
    { name: 'Battery life', placeholder: '12 hours' },
    { name: 'Warranty', placeholder: '12 months' },
  ],
  'phones-smartphones': [
    { name: 'Brand', placeholder: 'Samsung, Tecno, iPhone…', required: true },
    { name: 'Model', placeholder: 'Galaxy A15', required: true },
    { name: 'Storage', placeholder: '128 GB', required: true },
    { name: 'RAM', placeholder: '6 GB' },
    { name: 'Screen size', placeholder: '6.6 inch' },
    { name: 'Battery', placeholder: '5000 mAh' },
    { name: 'Camera', placeholder: '50 MP + 2 MP' },
    { name: 'SIM', placeholder: 'Dual SIM' },
    { name: 'Warranty', placeholder: '12 months' },
  ],
  'beauty-skincare': [
    { name: 'Brand', placeholder: 'Brand name', required: true },
    { name: 'Volume / weight', placeholder: '50 ml', required: true },
    {
      name: 'Skin type',
      placeholder: 'All types',
      type: 'select',
      options: ['All types', 'Dry', 'Oily', 'Combination', 'Sensitive'],
    },
    { name: 'Key ingredients', placeholder: 'Niacinamide, shea' },
    { name: 'SPF', placeholder: 'None, SPF 30' },
    { name: 'Expiry / PAO', placeholder: '12 months after opening' },
  ],
  'fashion-dresses': [
    { name: 'Brand', placeholder: 'Brand or tailor', required: true },
    { name: 'Material', placeholder: 'Chiffon, cotton', required: true },
    { name: 'Length', placeholder: 'Midi', type: 'select', options: ['Mini', 'Knee', 'Midi', 'Maxi'] },
    { name: 'Neckline', placeholder: 'V-neck, round, square' },
    { name: 'Sleeve', placeholder: 'Sleeveless, short, long' },
    { name: 'Occasion', placeholder: 'Casual, wedding, office' },
    { name: 'Care instructions', placeholder: 'Hand wash' },
  ],
  'grocery-spices': [
    { name: 'Type', placeholder: 'Chili, curry, mix', required: true },
    { name: 'Net weight', placeholder: '100 g', required: true },
    { name: 'Heat / intensity', placeholder: 'Mild, hot' },
    { name: 'Origin', placeholder: 'Rwanda, India' },
    { name: 'Storage', placeholder: 'Airtight, dry' },
  ],
  'local-coffee-tea': [
    { name: 'Producer', placeholder: 'Co-op or brand', required: true },
    { name: 'Type', placeholder: 'Arabica, black tea' },
    { name: 'Net weight', placeholder: '250 g', required: true },
    { name: 'Region', placeholder: 'Nyungwe, Musanze' },
    { name: 'Roast / grade', placeholder: 'Medium roast' },
  ],
  'furniture-living': [
    { name: 'Material', placeholder: 'Wood, fabric, metal', required: true },
    { name: 'Color / finish', placeholder: 'Walnut, grey' },
    { name: 'Seating', placeholder: '3-seater' },
    { name: 'Assembly', placeholder: 'Required / none' },
    { name: 'Dimensions note', placeholder: 'Fits small Kigali living rooms' },
  ],
};

const PARENT_VARIANT: Record<string, VariantKind> = {
  fashion: 'apparel',
  shoes: 'apparel',
  electronics: 'device',
  phones: 'device',
  beauty: 'pack',
  grocery: 'pack',
  'local-products': 'pack',
  bags: 'generic',
  furniture: 'generic',
  sports: 'generic',
  automotive: 'generic',
  office: 'generic',
  accessories: 'generic',
  'home-living': 'generic',
  'baby-products': 'apparel',
};

const DEFAULT_SPECS: SpecFieldDef[] = [
  { name: 'Brand', placeholder: 'Brand or maker' },
  { name: 'Material', placeholder: 'What it is made of' },
  { name: 'Key feature', placeholder: 'What shoppers should know', required: true },
  COMMON_ORIGIN,
];

export function specsForCategory(parentSlug?: string | null, subSlug?: string | null): SpecFieldDef[] {
  if (subSlug && SUB_SPECS[subSlug]) return SUB_SPECS[subSlug];
  if (parentSlug && PARENT_SPECS[parentSlug]) return PARENT_SPECS[parentSlug];
  return DEFAULT_SPECS;
}

export function mergeSpecValues(
  current: Array<{ name: string; value: string; key?: string }>,
  defs: SpecFieldDef[],
) {
  const values = new Map(
    current.map((row) => [row.name.trim().toLowerCase(), row.value] as const),
  );
  const used = new Set<string>();
  const rows = defs.map((def) => {
    const key = def.name.toLowerCase();
    used.add(key);
    return {
      key: `tpl-${key.replace(/[^a-z0-9]+/g, '-')}`,
      name: def.name,
      value: values.get(key) || '',
    };
  });
  const extras = current
    .filter(
      (row) =>
        row.name.trim() && !used.has(row.name.trim().toLowerCase()) && row.value.trim(),
    )
    .map((row) => ({
      key: row.key || `extra-${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: row.name,
      value: row.value,
    }));
  return [...rows, ...extras];
}

export function variantKindForCategory(parentSlug?: string | null): VariantKind {
  if (parentSlug && PARENT_VARIANT[parentSlug]) return PARENT_VARIANT[parentSlug];
  return 'generic';
}

export function variantLabels(kind: VariantKind) {
  switch (kind) {
    case 'apparel':
      return {
        title: 'Colors & sizes',
        hint: 'Each color/size is its own stock. If Blue / XL hits 0, other sizes stay buyable.',
        first: 'Color',
        firstPlaceholder: 'Blue',
        second: 'Size',
        secondPlaceholder: 'XL',
        add: 'Add color / size',
      };
    case 'device':
      return {
        title: 'Options & stock',
        hint: 'Split stock by color or storage so shoppers cannot oversell one option.',
        first: 'Color',
        firstPlaceholder: 'Black',
        second: 'Storage / option',
        secondPlaceholder: '128 GB',
        add: 'Add option',
      };
    case 'pack':
      return {
        title: 'Pack sizes',
        hint: 'Use one row for a single pack, or add sizes such as 250 g and 500 g.',
        first: 'Pack size',
        firstPlaceholder: '500 g',
        second: 'Unit note',
        secondPlaceholder: 'Box of 12',
        add: 'Add pack size',
      };
    default:
      return {
        title: 'Options & stock',
        hint: 'Add each sellable option with its own stock count.',
        first: 'Option',
        firstPlaceholder: 'Standard',
        second: 'Detail',
        secondPlaceholder: 'Large',
        add: 'Add option',
      };
  }
}
