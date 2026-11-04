import {
  router,
  json,
  error,
  db,
  storage,
  secrets,
  increment,
  requireAuth,
  requireAdminEmailAllowlist,
  isAppDatabaseError,
} from '@appdeploy/sdk';
import type { RouterMiddleware } from '@appdeploy/sdk';
import { createHash, randomUUID } from 'node:crypto';
import {
  defaultContent,
  validateProduct,
  validateInquiry,
  validateContent,
  record,
  text,
  choice,
  canTransition,
  states,
  ValidationError,
} from '../shared/domain';
import type { Product, Inquiry, SiteContent } from '../shared/domain';

const ADMIN_EMAILS = ['johncharlessarwi@gmail.com'];
const guards = () => [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS)];
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const now = () => new Date().toISOString();
const safe =
  (fn: RouterMiddleware): RouterMiddleware =>
  async ctx => {
    try {
      return await fn(ctx);
    } catch (e) {
      if (e instanceof ValidationError) return error(e.message, 400);
      if (isAppDatabaseError(e)) {
        if (e.code === 'AppDatabaseQuotaExceeded')
          return error('Service is busy. Please try later.', 429);
        if (
          [
            'AppDatabaseConflict',
            'AppDatabaseConditionFailed',
            'AppDatabaseDuplicateId',
          ].includes(e.code)
        )
          return error('This record changed. Refresh and try again.', 409);
      }
      return error(
        'Unable to complete the operation. Your saved data has not been cleared. Retry safely.',
        503
      );
    }
  };

async function throttle(key: string, maximum = 10) {
  const id = hash(key);
  const window = Math.floor(Date.now() / 600000);
  await db.tx.add('rate_limits', [{ id, window, count: 0 }]);
  for (let attempt = 0; attempt < 3; attempt++) {
    const [entry] = await db.get<{ window: number; count: number }>(
      'rate_limits',
      [id],
      { consistent: true }
    );
    if (!entry) return false;
    if (entry.window === window && entry.count >= maximum) return false;
    const [ok] = await db.tx.update(
      'rate_limits',
      [
        {
          id,
          record: {
            window,
            count: entry.window === window ? entry.count + 1 : 1,
          },
          if: { window: entry.window, count: entry.count },
        },
      ],
      { patch: true }
    );
    if (ok) return true;
  }
  return false;
}

async function withImages(product: Product): Promise<Product> {
  const urls = product.images.length ? await storage.url(product.images) : [];
  return { ...product, imageUrls: urls.map(x => x.url) };
}
async function audit(actor: string, action: string, target: string) {
  return { id: randomUUID(), actor, action, target, at: now() };
}
async function notify(request: Inquiry) {
  if (request.notification === 'Sent') return 'Sent';
  const names = await secrets.listSecretNames();
  if (
    !['RESEND_API_KEY', 'EMAIL_FROM', 'COMPANY_EMAIL'].every(n =>
      names.includes(n)
    )
  )
    return 'Not configured';
  const [key, from, to] = await Promise.all(
    ['RESEND_API_KEY', 'EMAIL_FROM', 'COMPANY_EMAIL'].map(n =>
      secrets.readSecret(n)
    )
  );
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `techsavy-${request.id}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `TECHSAVY request ${request.reference}`,
        text: `New ${request.kind.toLowerCase()} request ${request.reference}. Sign in to the TECHSAVY admin dashboard to review and respond.`,
      }),
    });
    return response.ok ? 'Sent' : 'Failed';
  } catch {
    return 'Failed';
  }
}

export const handler = router({
  'GET /api/products': [
    safe(async ({ query }) => {
      // Filters apply only to one bounded page; the cursor always remains available.
      const result = await db.list<Product>('products', {
        limit: 48,
        nextToken: query.cursor || undefined,
      });
      const published = result.items.filter(p => p.status === 'Published');
      return json({
        items: await Promise.all(published.map(withImages)),
        cursor: result.nextToken || null,
      });
    }),
  ],
  'GET /api/products/:id': [
    safe(async ({ params }) => {
      const [product] = await db.get<Product>('products', [params.id], {
        consistent: true,
      });
      if (!product || product.status !== 'Published')
        return error('Product not found.', 404);
      return json(await withImages({ ...product, id: params.id }));
    }),
  ],
  'GET /api/content': [
    safe(async () => {
      const [content] = await db.get<SiteContent>('content', ['site']);
      return json(content || defaultContent);
    }),
  ],
  'POST /api/requests': [
    safe(async ({ body, event }) => {
      const form = validateInquiry(body);
      const ip =
        event.requestContext?.http?.sourceIp ||
        event.requestContext?.identity?.sourceIp ||
        'unknown';
      const fingerprint = hash(JSON.stringify(form));
      const id = form.token;
      const [old] = await db.get<Inquiry>('requests', [id], {
        consistent: true,
      });
      if (old) {
        if (old.fingerprint !== fingerprint)
          return error(
            'This submission key was already used. Open a new request.',
            409
          );
        return json({ reference: old.reference });
      }
      if (!(await throttle(`requests:${ip}`)))
        return error(
          'Too many requests. Please try again in ten minutes.',
          429
        );
      let product: Product | null = null;
      if (form.kind === 'Product') {
        [product] = await db.get<Product>('products', [form.productId], {
          consistent: true,
        });
        if (!product || product.status !== 'Published')
          return error(
            'This product is no longer available. Refresh the catalog.',
            404
          );
        if (product.availability === 'Out of stock')
          return error(
            'This product is currently out of stock. Please send a general quotation request.',
            409
          );
      }
      const at = now();
      const inquiry: Inquiry = {
        ...form,
        id,
        reference: `TS-${id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
        productName: product?.name || '',
        price: product?.price ?? null,
        status: 'New',
        createdAt: at,
        history: [
          { status: 'New', at, actor: 'Customer', reason: 'Submitted online' },
        ],
        notification: 'Pending',
        fingerprint,
      };
      const [saved] = await db.tx.add('requests', [{ ...inquiry }]);
      if (!saved) {
        const [existing] = await db.get<Inquiry>('requests', [id], {
          consistent: true,
        });
        if (existing?.fingerprint === fingerprint)
          return json({ reference: existing.reference });
        return error('Submission conflict. Retry with the same form.', 409);
      }
      // Email cannot make an already persisted inquiry appear to have failed.
      try {
        const notification = await notify(inquiry);
        await db.tx.update('requests', [{ id, record: { notification } }], {
          patch: true,
        });
      } catch {
        /* Pending is deliberately retained for an administrator retry. */
      }
      return json({ reference: inquiry.reference }, 201);
    }),
  ],
  'POST /api/visit': [
    safe(async ({ body, event }) => {
      const b = record(body);
      if (b.consent !== true)
        return error('Analytics consent is required.', 400);
      const visitor = text(b.visitor, 36, true);
      if (!/^[a-f0-9-]{36}$/.test(visitor))
        return error('Invalid visitor identifier.', 400);
      const route = choice(b.route, [
        'home',
        'products',
        'about',
        'services',
        'contact',
      ]);
      const agent = String(event.headers?.['user-agent'] || '');
      if (/bot|crawler|spider|headless/i.test(agent))
        return json({ recorded: false });
      const ip = event.requestContext?.http?.sourceIp || 'unknown';
      if (!(await throttle(`analytics:${ip}`, 100)))
        return error('Analytics rate limit.', 429);
      const day = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Africa/Dar_es_Salaam',
      });
      await db.tx.add('metrics', [
        { id: 'all', views: 0, visitors: 0, startedAt: now() },
        { id: day, views: 0, visitors: 0 },
      ]);
      const visitorId = hash(visitor);
      const [known] = await db.get<{ day: string }>('visitors', [visitorId], {
        consistent: true,
      });
      const writes = [
        db.tx.update(
          'metrics',
          [
            {
              id: 'all',
              record: {
                views: increment(1),
                visitors: increment(known ? 0 : 1),
              },
            },
          ],
          { patch: true }
        ),
        db.tx.update(
          'metrics',
          [
            {
              id: day,
              record: {
                views: increment(1),
                visitors: increment(known?.day === day ? 0 : 1),
              },
            },
          ],
          { patch: true }
        ),
      ];
      if (known) {
        await db.transact([
          ...writes,
          db.tx.update(
            'visitors',
            [{ id: visitorId, record: { day, route }, if: { day: known.day } }],
            { patch: true }
          ),
        ]);
      } else {
        await db.transact([
          ...writes,
          db.tx.add('visitors', [{ id: visitorId, day, route }]),
        ]);
      }
      return json({ recorded: true });
    }),
  ],
  'GET /api/admin': [
    ...guards(),
    safe(async ({ user, query }) => {
      const [products, requests, content] = await Promise.all([
        db.list<Product>('products', {
          limit: 48,
          nextToken: query.productsCursor || undefined,
        }),
        db.list<Inquiry>('requests', {
          limit: 50,
          nextToken: query.requestsCursor || undefined,
        }),
        db.get<SiteContent>('content', ['site']),
      ]);
      const day = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Africa/Dar_es_Salaam',
      });
      const metrics = await db.get('metrics', ['all', day]);
      return json({
        email: user!.email,
        products: await Promise.all(products.items.map(withImages)),
        requests: requests.items.map(
          ({ fingerprint: _fingerprint, ...r }) => r
        ),
        productsCursor: products.nextToken || null,
        requestsCursor: requests.nextToken || null,
        content: content[0] || defaultContent,
        metrics: { all: metrics[0], today: metrics[1] },
      });
    }),
  ],
  'POST /api/admin/products': [
    ...guards(),
    safe(async ({ body, user }) => {
      const product = validateProduct(body);
      const id = randomUUID();
      await db.transact([
        db.tx.add('products', [
          { ...product, id, version: 1, createdAt: now() },
        ]),
        db.tx.add('audit', [await audit(user!.userId, 'product.create', id)]),
      ]);
      return json({ id }, 201);
    }),
  ],
  'PUT /api/admin/products/:id': [
    ...guards(),
    safe(async ({ body, params, user }) => {
      const b = record(body);
      const product = validateProduct(b);
      const version = Number(b.version);
      if (!Number.isInteger(version) || version < 1)
        return error('Refresh the product before editing.', 409);
      await db.transact([
        db.tx.update(
          'products',
          [
            {
              id: params.id,
              record: { ...product, version: version + 1 },
              if: { version },
            },
          ],
          { patch: true }
        ),
        db.tx.add('audit', [
          await audit(
            user!.userId,
            `product.${product.status.toLowerCase()}`,
            params.id
          ),
        ]),
      ]);
      return json({ updated: true });
    }),
  ],
  'POST /api/admin/images': [
    ...guards(),
    safe(async ({ body, user }) => {
      const b = record(body);
      const type = choice(b.type, ['image/png', 'image/jpeg', 'image/webp']);
      const base64 = text(b.base64, 7000000, true);
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))
        return error('Invalid image encoding.', 400);
      const bytes = Buffer.from(base64, 'base64');
      if (bytes.length > 5 * 1024 * 1024 || bytes.length < 12)
        return error('Image must be under 5 MB.', 400);
      const valid =
        type === 'image/png'
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : type === 'image/jpeg'
            ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            : bytes.toString('ascii', 0, 4) === 'RIFF' &&
              bytes.toString('ascii', 8, 12) === 'WEBP';
      if (!valid)
        return error('The file does not match its image format.', 400);
      if (!(await throttle(`uploads:${user!.userId}`, 30)))
        return error('Upload limit reached. Try later.', 429);
      const ext =
        type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : 'webp';
      const path = `products/${randomUUID()}.${ext}`;
      const [ok] = await storage.write([
        { path, content: base64, contentType: type },
      ]);
      if (!ok) return error('Image upload failed. Please retry.', 503);
      const [signed] = await storage.url([path]);
      return json({ path, url: signed.url }, 201);
    }),
  ],
  'PUT /api/admin/requests/:id': [
    ...guards(),
    safe(async ({ body, params, user }) => {
      const b = record(body);
      const status = choice(b.status, states);
      const reason = text(b.reason, 500, true);
      const [existing] = await db.get<Inquiry>('requests', [params.id], {
        consistent: true,
      });
      if (!existing) return error('Request not found.', 404);
      if (!canTransition(existing.status, status))
        return error('This status change is not allowed.', 409);
      const history = [
        ...existing.history,
        { status, at: now(), actor: user!.userId, reason },
      ];
      await db.transact([
        db.tx.update(
          'requests',
          [
            {
              id: params.id,
              record: { status, history },
              if: { status: existing.status },
            },
          ],
          { patch: true }
        ),
        db.tx.add('audit', [
          await audit(
            user!.userId,
            `request.${status.toLowerCase()}`,
            params.id
          ),
        ]),
      ]);
      return json({ updated: true });
    }),
  ],
  'POST /api/admin/requests/:id/notify': [
    ...guards(),
    safe(async ({ params }) => {
      const [request] = await db.get<Inquiry>('requests', [params.id], {
        consistent: true,
      });
      if (!request) return error('Request not found.', 404);
      const notification = await notify({ ...request, id: params.id });
      await db.tx.update(
        'requests',
        [{ id: params.id, record: { notification } }],
        { patch: true }
      );
      return json({ notification });
    }),
  ],
  'PUT /api/admin/content': [
    ...guards(),
    safe(async ({ body, user }) => {
      const content = validateContent(body);
      await db.transact([
        db.tx.update('content', [{ id: 'site', record: { ...content } }]),
        db.tx.add('audit', [
          await audit(user!.userId, 'content.update', 'site'),
        ]),
      ]);
      return json(content);
    }),
  ],
  'GET /api/admin/audit': [
    ...guards(),
    safe(async ({ query }) => {
      return json(
        await db.list('audit', {
          limit: 50,
          nextToken: query.cursor || undefined,
        })
      );
    }),
  ],
});
