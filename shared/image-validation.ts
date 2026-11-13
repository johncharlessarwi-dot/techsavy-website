/** Lightweight WebP container checks; this is not a full image decoder. */
export function isPlausibleWebP(bytes: Uint8Array): boolean {
  if (bytes.length < 20) return false;
  const view = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.toString('ascii', 0, 4) !== 'RIFF') return false;
  if (view.toString('ascii', 8, 12) !== 'WEBP') return false;
  if (view.readUInt32LE(4) !== bytes.length - 8) return false;
  return ['VP8 ', 'VP8L', 'VP8X'].includes(view.toString('ascii', 12, 16));
}
