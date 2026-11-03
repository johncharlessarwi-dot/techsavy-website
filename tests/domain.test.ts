import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateInquiry,
  validateProduct,
  validateContent,
  canTransition,
} from '../shared/domain.ts';
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
  name: 'QA Laptop',
  category: 'Laptops',
  brand: 'Test',
  model: 'QA',
  description: 'Test specification',
  condition: 'New',
  price: null,
  availability: 'Available',
  status: 'Draft',
  images: [],
};
test('accept guest quotations and valid phone contacts', () => {
  assert.equal(validateInquiry(inquiry).quantity, 2);
  assert.equal(
    validateInquiry({ ...inquiry, contact: 'qa@example.com' }).contact,
    'qa@example.com',
  );
});
test('reject fractional, negative, zero and excessive quantities', () => {
  for (const quantity of [0, -1, 1.5, 10001, NaN])
    assert.throws(() => validateInquiry({ ...inquiry, quantity }));
});
test('require contact, consent and valid submission tokens', () => {
  for (const patch of [
    { contact: 'bad' },
    { consent: false },
    { token: 'reuse' },
    { website: 'spam' },
    { name: '' },
  ])
    assert.throws(() => validateInquiry({ ...inquiry, ...patch }));
});
test('only recognized services can be requested', () => {
  assert.throws(() =>
    validateInquiry({ ...inquiry, kind: 'Service', service: 'invalid' }),
  );
  assert.equal(
    validateInquiry({ ...inquiry, kind: 'Service', service: 'Networking' })
      .service,
    'Networking',
  );
});
test('publishing requires an uploaded image and valid price', () => {
  assert.equal(validateProduct(product).price, null);
  assert.throws(() => validateProduct({ ...product, status: 'Published' }));
  assert.throws(() => validateProduct({ ...product, price: -50 }));
  assert.throws(() =>
    validateProduct({ ...product, images: ['https://evil.test/a.svg'] }),
  );
  assert.equal(
    validateProduct({
      ...product,
      status: 'Published',
      images: ['products/0123-abcd.png'],
    }).status,
    'Published',
  );
});
test('closed requests cannot be reopened or skip status stages', () => {
  assert.equal(canTransition('New', 'Contacted'), true);
  assert.equal(canTransition('Contacted', 'Confirmed'), true);
  assert.equal(canTransition('Confirmed', 'Completed'), true);
  for (const from of ['New', 'Contacted', 'Confirmed'])
    assert.equal(canTransition(from, 'Cancelled'), true);
  assert.equal(canTransition('New', 'Completed'), false);
  assert.equal(canTransition('Completed', 'New'), false);
  assert.equal(canTransition('Cancelled', 'Confirmed'), false);
});
test('contact configuration rejects unsafe email and WhatsApp values', () => {
  assert.throws(() =>
    validateContent({ about: 'Company', email: 'javascript:evil' }),
  );
  assert.throws(() =>
    validateContent({ about: 'Company', whatsapp: 'javascript:evil' }),
  );
  assert.equal(
    validateContent({ about: 'Company', whatsapp: '255700000000' }).whatsapp,
    '255700000000',
  );
});
