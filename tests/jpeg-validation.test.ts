import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlausibleJpeg } from '../shared/jpeg-validation.ts';

const jpeg = () => Buffer.from([
  0xff, 0xd8,
  0xff, 0xc0, 0x00, 0x04, 0x00, 0x00,
  0xff, 0xda, 0x00, 0x04, 0x00, 0x00,
  0x12, 0x34,
  0xff, 0xd9,
]);

test('JPEG marker parser recognizes framed scan and end marker', () => {
  assert.equal(isPlausibleJpeg(jpeg()), true);
});

test('JPEG parser rejects missing EOI and invalid SOI', () => {
  assert.equal(isPlausibleJpeg(jpeg().subarray(0, -2)), false);
  const fake = jpeg();
  fake[0] = 0;
  assert.equal(isPlausibleJpeg(fake), false);
});

test('JPEG parser rejects oversized marker segments', () => {
  const fake = jpeg();
  fake.writeUInt16BE(0xffff, 4);
  assert.equal(isPlausibleJpeg(fake), false);
});

test('JPEG parser rejects a scan without a preceding frame', () => {
  const fake = Buffer.from([0xff, 0xd8, 0xff, 0xda, 0, 4, 0, 0, 1, 2, 0xff, 0xd9]);
  assert.equal(isPlausibleJpeg(fake), false);
});
