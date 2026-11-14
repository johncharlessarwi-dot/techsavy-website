import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeImageBase64 } from '../shared/base64-validation.ts';

test('canonical Base64 round trips binary bytes', () => {
  for (const bytes of [
    Buffer.from([0]),
    Buffer.from([1, 2]),
    Buffer.from([1, 2, 3]),
    Buffer.from([0, 255, 128, 64, 16]),
  ]) {
    assert.deepEqual(decodeImageBase64(bytes.toString('base64')), bytes);
  }
});

test('reject noncanonical Base64, whitespace and missing padding', () => {
  for (const encoded of ['AB==', 'AAA=', 'AQ=', 'AQ', 'AQ===', 'AQ==\\n', ' AQ==', 'AQ== ', 'AQ-_']) {
    assert.equal(decodeImageBase64(encoded), null, encoded);
  }
});

test('reject empty or oversized Base64 before allocation', () => {
  assert.equal(decodeImageBase64(''), null);
  assert.equal(decodeImageBase64('A'.repeat(7_000_004)), null);
});
