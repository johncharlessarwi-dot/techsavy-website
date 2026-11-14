import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlausibleWebP } from '../shared/image-validation.ts';

function webp(chunk: string, payload = 4): Buffer {
  const bytes = Buffer.alloc(20 + payload + (payload % 2));
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WEBP', 8, 'ascii');
  bytes.write(chunk, 12, 'ascii');
  bytes.writeUInt32LE(payload, 16);
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

test('WebP rejects chunk size claims extending past the actual file', () => {
  const bytes = webp('VP8 ');
  bytes.writeUInt32LE(0xffffffff, 16);
  assert.equal(isPlausibleWebP(bytes), false);
});

test('WebP requires every chunk header and payload to fit RIFF bounds', () => {
  const bytes = webp('VP8 ');
  const truncated = Buffer.concat([bytes, Buffer.from([1, 2, 3, 4])]);
  truncated.writeUInt32LE(truncated.length - 8, 4);
  assert.equal(isPlausibleWebP(truncated), false);

  const second = Buffer.alloc(10);
  second.write('EXIF', 0, 'ascii');
  second.writeUInt32LE(4, 4);
  const incomplete = Buffer.concat([bytes, second]);
  incomplete.writeUInt32LE(incomplete.length - 8, 4);
  assert.equal(isPlausibleWebP(incomplete), false);
});

test('WebP supports correctly padded odd-sized chunks', () => {
  assert.equal(isPlausibleWebP(webp('VP8 ', 5)), true);
  const odd = webp('VP8 ', 5);
  const missingPad = odd.subarray(0, -1);
  missingPad.writeUInt32LE(missingPad.length - 8, 4);
  assert.equal(isPlausibleWebP(missingPad), false);
});
