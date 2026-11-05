export type CatalogSort = 'featured' | 'price-low' | 'price-high' | 'name';
export function sortCatalog<
  T extends { name: string; price: number | null; featured: boolean },
>(items: T[], order: CatalogSort): T[] {
  return [...items].sort((a, b) => {
    if (order === 'name') return a.name.localeCompare(b.name);
    if (order === 'featured') return Number(b.featured) - Number(a.featured);
    if (a.price === null) return b.price === null ? 0 : 1;
    if (b.price === null) return -1;
    return order === 'price-low' ? a.price - b.price : b.price - a.price;
  });
}
export function readFavoriteIds(raw: string | null): string[] {
  // Local storage can be modified by extensions or pasted user data.
  if (raw !== null && (typeof raw !== 'string' || raw.length > 65536)) return [];
  try {
    const value: unknown = JSON.parse(raw || '[]');
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === 'string' && id.trim().length > 0 && id.length <= 100,
            ),
          ),
        ].slice(0, 200)
      : [];
  } catch {
    return [];
  }
}
