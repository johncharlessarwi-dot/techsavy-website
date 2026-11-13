import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlausibleWebP } from '../shared/image-validation.ts';

function webp(chunk: string, payload = 4): Buffer {
  const bytes = Buffer.alloc(16 + payload);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WEBP', 8, 'ascii');
  bytes.write(chunk, 12, 'ascii');
  return bytes;
}

test('WebP container accepts recognized chunks with matching RIFF size', () => {
  for (const chunk of ['VP8 ', 'VP8L', 'VP8X'])
    assert.equal(isPlausibleWebP(webp(chunk)), true);
});

test('WebP container rejects truncated data and invalid signatures', () => {
  assert.equal(isPlausibleWebP(Buffer.alloc(19)), false);
  const badRiff = webp('VP8 ');
  badRiff.write('FAKE', 0, 'ascii');
  assert.equal(isPlausibleWebP(badRiff), false);
  const badWebp = webp('VP8 ');
  badWebp.write('JUNK', 8, 'ascii');
  assert.equal(isPlausibleWebP(badWebp), false);
});

test('WebP container rejects forged RIFF sizes and unrecognized chunks', () => {
  const badLength = webp('VP8 ');
  badLength.writeUInt32LE(0, 4);
  assert.equal(isPlausibleWebP(badLength), false);
  assert.equal(isPlausibleWebP(webp('EVIL')), false);
  const appended = Buffer.concat([webp('VP8 '), Buffer.from([0])]);
  assert.equal(isPlausibleWebP(appended), false);
});

test('WebP container checks Uint8Array slice boundaries', () => {
  const encoded = webp('VP8 ');
  const wrapper = Buffer.concat([Buffer.alloc(7), encoded, Buffer.alloc(9)]);
  assert.equal(isPlausibleWebP(wrapper.subarray(7, 7 + encoded.length)), true);
  assert.equal(isPlausibleWebP(wrapper), false);
});
