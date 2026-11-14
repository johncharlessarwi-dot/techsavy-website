/** Validates WebP RIFF and chunk framing; not a full image decoder. */
export function isPlausibleWebP(bytes: Uint8Array): boolean {
  if (bytes.length < 24) return false;
  const view = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.toString('ascii', 0, 4) !== 'RIFF') return false;
  if (view.toString('ascii', 8, 12) !== 'WEBP') return false;
  if (view.readUInt32LE(4) !== bytes.length - 8) return false;
  const first = view.toString('ascii', 12, 16);
  if (!['VP8 ', 'VP8L', 'VP8X'].includes(first)) return false;

  let offset = 12;
  let count = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length || ++count > 16384) return false;
    const chunkSize = view.readUInt32LE(offset + 4);
    const paddedSize = chunkSize + (chunkSize % 2);
    if (paddedSize > bytes.length - offset - 8) return false;
    offset += 8 + paddedSize;
  }
  return offset === bytes.length;
}
