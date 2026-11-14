import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlausiblePng } from '../shared/png-validation.ts';

function chunk(type: string, payload: Buffer): Buffer {
  const data = Buffer.alloc(payload.length + 12);
  data.writeUInt32BE(payload.length, 0);
  data.write(type, 4, 'ascii');
  payload.copy(data, 8);
  return data;
}

function png(): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', Buffer.from([1, 2, 3, 4])), chunk('IEND', Buffer.alloc(0))]);
}

test('PNG structural parser accepts bounded chunks', () => {
  assert.equal(isPlausiblePng(png()), true);
});

test('PNG structural parser rejects missing or trailing IEND data', () => {
  const original = png();
  assert.equal(isPlausiblePng(original.subarray(0, -1)), false);
  assert.equal(isPlausiblePng(Buffer.concat([original, Buffer.from([0])])), false);
});

test('PNG structural parser rejects oversized chunks and zero dimensions', () => {
  const size = png();
  size.writeUInt32BE(0xffffffff, 8);
  assert.equal(isPlausiblePng(size), false);
  const dimensions = png();
  dimensions.writeUInt32BE(0, 16);
  assert.equal(isPlausiblePng(dimensions), false);
});

test('PNG structural parser rejects duplicate IHDR chunks', () => {
  const original = png();
  const duplicate = Buffer.concat([original.subarray(0, -12), chunk('IHDR', Buffer.alloc(13)), original.subarray(-12)]);
  assert.equal(isPlausiblePng(duplicate), false);
});
