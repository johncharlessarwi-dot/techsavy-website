/** Structural PNG container checks, not a full image decoder. */
export function isPlausiblePng(bytes: Uint8Array): boolean {
  if (bytes.length < 57) return false;
  const view = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!view.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
  let offset = 8;
  let sawData = false;
  let chunks = 0;
  while (offset < view.length) {
    if (offset + 12 > view.length || ++chunks > 16384) return false;
    const size = view.readUInt32BE(offset);
    if (size > view.length - offset - 12) return false;
    const kind = view.toString('ascii', offset + 4, offset + 8);
    if (!/^[A-Za-z]{4}$/.test(kind)) return false;
    if (chunks === 1) {
      if (kind !== 'IHDR' || size !== 13) return false;
      const width = view.readUInt32BE(offset + 8);
      const height = view.readUInt32BE(offset + 12);
      if (width === 0 || height === 0 || width > 16384 || height > 16384) return false;
    } else if (kind === 'IHDR') return false;
    if (kind === 'IDAT') sawData = true;
    const end = offset + 12 + size;
    if (kind === 'IEND') return sawData && size === 0 && end === view.length;
    offset = end;
  }
  return false;
}
