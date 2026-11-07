export const categories = [
  'Laptops',
  'Desktops',
  'Monitors',
  'Accessories',
  'Networking',
  'Storage',
];
export function createUuid(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}
export const services = [
  'Computer repair',
  'Networking',
  'Software installation',
  'Data backup and recovery',
  'IT support',
  'Computer maintenance',
];
export const states = [
  'New',
  'Contacted',
  'Confirmed',
  'Completed',
  'Cancelled',
];
export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  condition: string;
  price: number | null;
  availability: string;
  status: string;
  specifications: string;
  warranty: string;
  images: string[];
  imageUrls?: string[];
  featured: boolean;
  version: number;
};
export type Inquiry = {
  id: string;
  reference: string;
  kind: string;
  name: string;
  contact: string;
  message: string;
  productId: string;
  productName: string;
  price: number | null;
  quantity: number;
  service: string;
  status: string;
  createdAt: string;
  history: { status: string; at: string; actor: string; reason: string }[];
  notification: string;
  fingerprint: string;
};
export type SiteContent = {
  about: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
};
export const defaultContent: SiteContent = {
  about:
    'TECHSAVY brings computer sales, equipment supply and practical IT services together. Explore hardware for your next project, request a quotation, or tell us what support you need.',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  hours: '',
};
export class ValidationError extends Error {}
export function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype)
    throw new ValidationError('Invalid submission.');
  return input as Record<string, unknown>;
}
export function text(value: unknown, max: number, required = false): string {
  if (value !== undefined && typeof value !== 'string')
    throw new ValidationError('Expected text.');
  const result = ((value as string | undefined) ?? '').trim();
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result) || result.length > max || (required && !result))
    throw new ValidationError('Check required fields and text length.');
  return result;
}
export function choice(value: unknown, values: string[]): string {
  if (typeof value !== 'string' || !values.includes(value))
    throw new ValidationError('Choose a valid option.');
  return value;
}
export function validateProduct(input: unknown) {
  const b = record(input);
  if (b.price !== null && b.price !== '' && typeof b.price !== 'number' && typeof b.price !== 'string') throw new ValidationError('Price must be a valid amount.');
  if (typeof b.price === 'boolean') throw new ValidationError('Price must be a valid amount.');
  if (typeof b.price === 'string' && b.price !== '' && !/^\d+(?:\.\d{1,2})?$/.test(b.price)) throw new ValidationError('Price must be a plain decimal amount.');
  const price = b.price === null || b.price === '' ? null : Number(b.price);
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1e10 || Math.round(price * 100) !== price * 100))
    throw new ValidationError('Price must be a valid amount.');
  const images = Array.isArray(b.images) ? b.images : [];
  if (
    images.length > 8 ||
    images.some(
      (x) =>
        typeof x !== 'string' ||
        !/^products\/[a-f0-9-]+\.(png|jpg|webp)$/.test(x),
    )
  )
    throw new ValidationError('Invalid product images.');
  const status = choice(b.status, ['Draft', 'Published', 'Archived']);
  if (status === 'Published' && !images.length)
    throw new ValidationError('Upload a product image before publishing.');
  return {
    name: text(b.name, 120, true),
    category: choice(b.category, categories),
    brand: text(b.brand, 80),
    model: text(b.model, 80),
    description: text(b.description, 3000, true),
    condition: choice(b.condition, ['New', 'Used', 'Refurbished']),
    price,
    availability: choice(b.availability, [
      'Available',
      'On request',
      'Out of stock',
    ]),
    status,
    specifications: text(b.specifications, 4000),
    warranty: text(b.warranty, 500),
    images: images as string[],
    featured: b.featured === true,
  };
}
export function validateInquiry(input: unknown) {
  const b = record(input);
  if (text(b.website, 200))
    throw new ValidationError('Unable to accept this submission.');
  if (b.consent !== true)
    throw new ValidationError(
      'Please agree to be contacted about this request.',
    );
  const contact = text(b.contact, 150, true);
  if (/[\u0000-\u001f\u007f]/.test(contact)) throw new ValidationError('Invalid contact details.');
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) &&
    !/^\+?[\d ()-]{9,20}$/.test(contact)
  )
    throw new ValidationError('Enter a valid email or phone number.');
  const kind = choice(b.kind, ['Product', 'Quotation', 'Service', 'Contact']);
  if (typeof b.quantity === 'boolean') throw new ValidationError('Quantity must be a whole number.');
  if (b.quantity !== undefined && typeof b.quantity !== 'number' && typeof b.quantity !== 'string') throw new ValidationError('Quantity must be a whole number.');
  if (typeof b.quantity === 'string' && !/^\d+$/.test(b.quantity)) throw new ValidationError('Quantity must contain decimal digits only.');
  const quantity = Number(b.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000)
    throw new ValidationError('Quantity must be between 1 and 10,000.');
  const service = kind === 'Service' ? choice(b.service, services) : '';
  const token = text(b.token, 36, true);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      token,
    )
  )
    throw new ValidationError('Please refresh the form and try again.');
  return {
    kind,
    token,
    name: text(b.name, 100, true),
    contact,
    message: text(b.message, 3000, kind !== 'Product'),
    quantity,
    service,
    productId: text(b.productId, 100),
  };
}
export function canTransition(from: string, to: string): boolean {
  return (
    (
      {
        New: ['Contacted', 'Cancelled'],
        Contacted: ['Confirmed', 'Cancelled'],
        Confirmed: ['Completed', 'Cancelled'],
      } as Record<string, string[]>
    )[from]?.includes(to) ?? false
  );
}
export function validateContent(input: unknown): SiteContent {
  const b = record(input);
  const email = text(b.email, 150);
  const whatsapp = text(b.whatsapp, 20);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ValidationError('Invalid email address.');
  if (whatsapp && !/^\d{9,15}$/.test(whatsapp))
    throw new ValidationError(
      'WhatsApp must include country code, digits only.',
    );
  return {
    about: text(b.about, 5000, true),
    email,
    whatsapp,
    phone: text(b.phone, 50),
    address: text(b.address, 250),
    hours: text(b.hours, 200),
  };
}
