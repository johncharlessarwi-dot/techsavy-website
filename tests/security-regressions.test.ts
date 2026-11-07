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

