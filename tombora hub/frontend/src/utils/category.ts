export type CategoryRef = {
  name: string;
  slug: string;
  parent?: { name: string; slug: string } | null;
};

export function categoryPath(category?: CategoryRef | null) {
  if (!category) return '—';
  return category.parent ? `${category.parent.name} / ${category.name}` : category.name;
}

export function findCategoryPlacement(
  categories: Array<{ id: string; children?: Array<{ id: string }> }>,
  categoryId?: string | null,
) {
  if (!categoryId) return { parentId: '', subId: '' };
  for (const parent of categories) {
    if (parent.id === categoryId) return { parentId: parent.id, subId: '' };
    const child = (parent.children || []).find((item) => item.id === categoryId);
    if (child) return { parentId: parent.id, subId: child.id };
  }
  return { parentId: '', subId: '' };
}
