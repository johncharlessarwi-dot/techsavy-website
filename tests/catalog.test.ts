import test from 'node:test';
import assert from 'node:assert/strict';
import { sortCatalog, readFavoriteIds } from '../shared/catalog.ts';

test('unknown prices stay last in both price directions and input is preserved', () => {
  const items = [
    { name: 'Unknown', price: null, featured: false },
    { name: 'Costly', price: 500, featured: false },
    { name: 'Free', price: 0, featured: true },
  ];
  assert.deepEqual(
    sortCatalog(items, 'price-low').map((x) => x.name),
    ['Free', 'Costly', 'Unknown'],
  );
  assert.deepEqual(
    sortCatalog(items, 'price-high').map((x) => x.name),
    ['Costly', 'Free', 'Unknown'],
  );
  assert.equal(items[0].name, 'Unknown');
  assert.equal(sortCatalog(items, 'featured')[0].name, 'Free');
  assert.equal(sortCatalog(items, 'name')[0].name, 'Costly');
});

test('favourites tolerate corrupt storage, reject invalid IDs and cap saved entries', () => {
  assert.deepEqual(readFavoriteIds('{bad'), []);
  assert.deepEqual(readFavoriteIds('{"id":"x"}'), []);
  assert.deepEqual(readFavoriteIds('["a","a",12,null,"", "b"]'), ['a', 'b']);
  assert.equal(
    readFavoriteIds(
      JSON.stringify(Array.from({ length: 250 }, (_, i) => `id-${i}`)),
    ).length,
    200,
  );
});

test('favourites reject oversized local storage data and whitespace-only IDs', () => {
  assert.deepEqual(readFavoriteIds(' '.repeat(65537)), []);
  assert.deepEqual(readFavoriteIds(JSON.stringify([' ', '\t', 'product-1'])), ['product-1']);
});
