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

test("accept binary float near decimal cent", () => {
  assert.equal(validateProduct({ ...product, price: 0.29 }).price, 0.29);
});

test("accept zero price for drafts", () => {
  assert.equal(validateProduct({ ...product, price: 0 }).price, 0);
});

test("reject negative prices", () => {
  assert.throws(() => validateProduct({ ...product, price: -1 }));
});

test("reject infinite prices", () => {
  assert.throws(() => validateProduct({ ...product, price: Infinity }));
});

test("reject NaN prices", () => {
  assert.throws(() => validateProduct({ ...product, price: NaN }));
});

test("reject boolean quotation quantities", () => {
  assert.throws(() => validateInquiry({ ...inquiry, quantity: true }));
});

test("reject array quotation quantities", () => {
  assert.throws(() => validateInquiry({ ...inquiry, quantity: [2] }));
});

test("reject object quotation quantities", () => {
  assert.throws(() => validateInquiry({ ...inquiry, quantity: { value: 2 } }));
});

test("reject scientific notation quotation quantities", () => {
  assert.throws(() => validateInquiry({ ...inquiry, quantity: '1e2' }));
});

test("reject decimal notation quotation quantities", () => {
  assert.throws(() => validateInquiry({ ...inquiry, quantity: '2.0' }));
});

test("accept plain decimal digit quantity", () => {
  assert.equal(validateInquiry({ ...inquiry, quantity: '2' }).quantity, 2);
});

test("reject fractional numerical quantity", () => {
  assert.throws(() => validateInquiry({ ...inquiry, quantity: 2.5 }));
});

test("reject excessive quantity", () => {
  assert.throws(() => validateInquiry({ ...inquiry, quantity: 10001 }));
});

test("reject forged Unicode contact controls", () => {
  assert.throws(() => validateInquiry({ ...inquiry, contact: '+255700000000\nX' }));
});

test("reject malformed public token", () => {
  assert.throws(() => validateInquiry({ ...inquiry, token: 'not-a-uuid' }));
});
