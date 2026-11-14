/** Validate canonical standard Base64 before decoding untrusted image uploads. */
export function decodeImageBase64(value: string): Buffer | null {
  if (value.length === 0 || value.length > 7_000_000 || value.length % 4 !== 0)
    return null;
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
    return null;
  const bytes = Buffer.from(value, 'base64');
  // Reject nonzero padding bits and noncanonical equivalents.
  if (bytes.toString('base64') !== value) return null;
  return bytes;
}
