import { test } from 'node:test';
import assert from 'node:assert/strict';
import { record, text, validateInquiry, validateProduct, validateContent, canTransition } from '../shared/domain.ts';
import { readFavoriteIds, sortCatalog } from '../shared/catalog.ts';

const inquiry = {
  kind: 'Quotation',
  token: '01010101-0101-4101-8101-010101010101',
  name: 'Test Buyer',
  contact: '+255700000000',
  quantity: 2,
  message: 'Two laptops',
  consent: true,
};
const product = {
  name: 'QA Laptop', category: 'Laptops', brand: 'Test', model: 'QA',
  description: 'Test specification', condition: 'New', price: null,
  availability: 'Available', status: 'Draft', images: [],
};


test("reject Date objects as request payloads", () => {
  assert.throws(() => record(new Date()));
});

test("reject Maps as request payloads", () => {
  assert.throws(() => record(new Map()));
});

test("reject Sets as request payloads", () => {
  assert.throws(() => record(new Set()));
});

test("reject arrays as request payloads", () => {
  assert.throws(() => record([]));
});

test("reject prototype-less request payloads", () => {
  assert.throws(() => record(Object.create(null)));
});

test("accept plain request payload objects", () => {
  assert.deepEqual(record({ hello: 'world' }), { hello: 'world' });
});

test("reject null bytes in text values", () => {
  assert.throws(() => text('buyer\u0000spoof', 100));
});

test("reject escape characters in text", () => {
  assert.throws(() => text('buyer\u001bspoof', 100));
});

test("allow ordinary multiline text fields", () => {
  assert.equal(text('line one\nline two', 100), 'line one\nline two');
});

test("reject boolean product prices", () => {
  assert.throws(() => validateProduct({ ...product, price: true }));
});

test("reject array product prices", () => {
  assert.throws(() => validateProduct({ ...product, price: [100] }));
});

test("reject object product prices", () => {
  assert.throws(() => validateProduct({ ...product, price: { amount: 100 } }));
});

test("reject exponent product prices", () => {
  assert.throws(() => validateProduct({ ...product, price: '1e5' }));
});

test("reject hex product prices", () => {
  assert.throws(() => validateProduct({ ...product, price: '0xFF' }));
});

test("reject fractional cent product prices", () => {
  assert.throws(() => validateProduct({ ...product, price: '10.001' }));
});

test("accept valid fractional cent precision", () => {
  assert.equal(validateProduct({ ...product, price: '10.25' }).price, 10.25);
});
