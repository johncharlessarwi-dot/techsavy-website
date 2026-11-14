/** Lightweight JPEG marker framing checks, not a JPEG decoder. */
export function isPlausibleJpeg(bytes: Uint8Array): boolean {
  if (bytes.length < 16) return false;
  const view = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view[0] !== 0xff || view[1] !== 0xd8) return false;
  if (view[view.length - 2] !== 0xff || view[view.length - 1] !== 0xd9) return false;

  let offset = 2;
  let sawFrame = false;
  let markers = 0;
  while (offset < view.length - 2) {
    if (view[offset++] !== 0xff || ++markers > 2048) return false;
    while (offset < view.length - 2 && view[offset] === 0xff) offset++;
    if (offset >= view.length - 2) return false;
    const marker = view[offset++];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x00) return false;
    if (marker >= 0xd0 && marker <= 0xd7) return false;
    if (marker === 0x01) continue;
    if (offset + 2 > view.length - 2) return false;
    const size = view.readUInt16BE(offset);
    if (size < 2 || size > view.length - 2 - offset) return false;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) sawFrame = true;
    if (marker === 0xda) return sawFrame && offset + size < view.length - 2;
    offset += size;
  }
  return false;
}
