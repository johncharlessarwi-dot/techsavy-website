import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, auth } from '@appdeploy/client';
import {
  Plus,
  LogOut,
  ShieldCheck,
  ImagePlus,
  ArrowUpRight,
  X,
  RefreshCw,
} from 'lucide-react';
import { categories, canTransition, states } from '../../shared/domain';
import type { Product, Inquiry, SiteContent } from '../../shared/domain';
import { errorMessage } from './RequestForm';

type Metric = { views: number; visitors: number; startedAt?: string };
type AdminData = {
  products: Product[];
  requests: Inquiry[];
  content: SiteContent;
  email: string;
  productsCursor: string | null;
  requestsCursor: string | null;
  metrics: { all: Metric | null; today: Metric | null };
};
const blank: Product = {
  id: '',
  name: '',
  category: 'Laptops',
  brand: '',
  model: '',
  description: '',
  condition: 'New',
  price: null,
  availability: 'On request',
  status: 'Draft',
  specifications: '',
  warranty: '',
  images: [],
  imageUrls: [],
  featured: false,
  version: 1,
};

export function Admin({
  onContent,
  onProducts,
}: {
  onContent: (c: SiteContent) => void;
  onProducts: () => void;
}) {
  const [restored, setRestored] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState('Overview');
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [requestSearch, setRequestSearch] = useState('');
  const [audit, setAudit] = useState<Record<string, string>[]>([]);
  const [auditCursor, setAuditCursor] = useState<string | undefined>();

  async function load(productsCursor = '', requestsCursor = '') {
    setFailure('');
    try {
      const result = await api.get(
        `/api/admin?productsCursor=${encodeURIComponent(productsCursor)}&requestsCursor=${encodeURIComponent(requestsCursor)}`,
      );
      setData(result.data);
      if (inquiry)
        setInquiry(
          result.data.requests.find((r: Inquiry) => r.id === inquiry.id) ||
            null,
        );
    } catch (e) {
      setData(null);
      setFailure(errorMessage(e));
    }
  }
  useEffect(() => {
    auth
      .getUser()
      .then(async (user) => {
        setSignedIn(Boolean(user));
        if (user) await load();
      })
      .catch((e) => setFailure(errorMessage(e)))
      .finally(() => setRestored(true));
  }, []);
  async function login() {
    setFailure('');
    setBusy(true);
    try {
      await auth.signInWithRedirect();
    } catch (e) {
      setFailure(errorMessage(e));
      setBusy(false);
    }
  }
  async function logout() {
    await auth.signOut();
    setData(null);
    setSignedIn(false);
    setInquiry(null);
    setEditing(null);
    setAudit([]);
  }
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setFailure('');
    setNotice('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      ...editing,
      ...fields,
      featured: fields.featured === 'on',
      price: fields.price === '' ? null : Number(fields.price),
    };
    try {
      if (editing.id)
        await api.put(`/api/admin/products/${editing.id}`, payload);
      else await api.post('/api/admin/products', payload);
      setEditing(null);
      setNotice('Product saved.');
      await load();
      onProducts();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files || !editing) return;
    if (editing.images.length + files.length > 8) {
      setFailure('Use up to eight images.');
      return;
    }
    setBusy(true);
    setFailure('');
    try {
      for (const file of Array.from(files)) {
        if (
          file.size > 5 * 1024 * 1024 ||
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        )
          throw new Error('Choose JPEG, PNG or WebP files up to 5 MB.');
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const { data: image } = await api.post('/api/admin/images', {
          type: file.type,
          base64,
        });
        setEditing(
          (old) =>
            old && {
              ...old,
              images: [...old.images, image.path],
              imageUrls: [...(old.imageUrls || []), image.url],
            },
        );
      }
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function setStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inquiry) return;
    setBusy(true);
    setFailure('');
    try {
      await api.put(
        `/api/admin/requests/${inquiry.id}`,
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      setNotice('Request status updated.');
      await load();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      const { data: saved } = await api.put(
        '/api/admin/content',
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      onContent(saved);
      setNotice('Company details saved.');
      await load();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function loadAudit(cursor = '') {
    try {
      const r = await api.get(
        `/api/admin/audit?cursor=${encodeURIComponent(cursor)}`,
      );
      setAudit(r.data.items);
      setAuditCursor(r.data.nextToken);
    } catch (e) {
      setFailure(errorMessage(e));
    }
  }
  const requests =
    data?.requests.filter((r) =>
      `${r.reference} ${r.name} ${r.contact} ${r.status}`
        .toLowerCase()
        .includes(requestSearch.toLowerCase()),
    ) || [];

  return (
    <section className='section container admin page-section'>
      <div className='section-head'>
        <div>
          <span className='eyebrow'>TECHSAVY WORKSPACE</span>
          <h1>Admin dashboard.</h1>
        </div>
        {signedIn && (
          <button className='button secondary' onClick={logout}>
            <LogOut size={17} />
            Sign out
          </button>
        )}
      </div>
      {failure && (
        <p className='error' role='alert'>
          {failure}
        </p>
      )}
      {notice && (
        <p className='notice' role='status'>
          {notice}
        </p>
      )}
      {!restored ? (
        <p>Restoring your session…</p>
      ) : !data ? (
        <div className='login-card'>
          <ShieldCheck size={40} />
          <h2>For authorized administrators.</h2>
          <p>
            Sign in with an approved account. Signing in does not automatically
            grant admin access.
          </p>
          {!signedIn ? (
            <button className='button primary' disabled={busy} onClick={login}>
              Sign in securely <ArrowUpRight size={18} />
            </button>
          ) : (
            <button className='button secondary' onClick={() => load()}>
              Retry dashboard
            </button>
          )}
        </div>
      ) : (
        <>
          <div className='admin-toolbar'>
            <div className='tabs'>
              {['Overview', 'Products', 'Requests', 'Company', 'Audit'].map(
                (t) => (
                  <button
                    key={t}
                    className={tab === t ? 'active' : ''}
                    onClick={() => {
                      setTab(t);
                      setNotice('');
                      if (t === 'Audit') void loadAudit();
                    }}
                  >
                    {t}
                  </button>
                ),
              )}
            </div>
            <button
              className='icon-button'
              aria-label='Refresh dashboard'
              onClick={() => load()}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          {tab === 'Overview' && (
            <>
              <div className='metrics-grid'>
                <div>
                  <span>Published products on this page</span>
                  <b>
                    {
                      data.products.filter((p) => p.status === 'Published')
                        .length
                    }
                  </b>
                </div>
                <div>
                  <span>New requests on this page</span>
                  <b>
                    {data.requests.filter((r) => r.status === 'New').length}
                  </b>
                </div>
                <div>
                  <span>Page views today</span>
                  <b>{data.metrics.today?.views ?? '—'}</b>
                </div>
                <div>
                  <span>Estimated browsers today</span>
                  <b>{data.metrics.today?.visitors ?? '—'}</b>
                </div>
              </div>
              <div className='panel'>
                <h2>Visitor analytics</h2>
                <p>
                  All-time page views:{' '}
                  <strong>{data.metrics.all?.views ?? 'Unavailable'}</strong> ·
                  Estimated unique browsers:{' '}
                  <strong>{data.metrics.all?.visitors ?? 'Unavailable'}</strong>
                </p>
                <p>
                  Collection began:{' '}
                  {data.metrics.all?.startedAt
                    ? new Date(data.metrics.all.startedAt).toLocaleString()
                    : 'No opted-in visits recorded yet'}
                </p>
                <p className='fine-print'>
                  Counts include opted-in browsers only. Admin sessions and
                  recognizable bots are excluded. Clearing browser storage or
                  using another device can count the same person again. Product
                  and request counts above describe the current data page.
                </p>
              </div>
            </>
          )}
          {tab === 'Products' && (
            <>
              <div className='split'>
                <p>Draft, publish, archive and restore your catalog.</p>
                <button
                  className='button primary'
                  onClick={() => {
                    setEditing({ ...blank });
                    setFailure('');
                  }}
                >
                  <Plus size={18} />
                  Add product
                </button>
              </div>
              {editing && (
                <div className='panel editor'>
                  <div className='split'>
                    <h2>{editing.id ? 'Edit product' : 'New product'}</h2>
                    <button
                      className='icon-button'
                      aria-label='Close product editor'
                      onClick={() => setEditing(null)}
                    >
                      <X />
                    </button>
                  </div>
                  <form onSubmit={saveProduct} key={editing.id || 'new'}>
                    <div className='form-grid'>
                      <label>
                        Product name
                        <input
                          name='name'
                          required
                          maxLength={120}
                          defaultValue={editing.name}
                        />
                      </label>
                      <label>
                        Category
                        <select name='category' defaultValue={editing.category}>
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Brand
                        <input
                          name='brand'
                          defaultValue={editing.brand}
                          maxLength={80}
                        />
                      </label>
                      <label>
                        Model
                        <input
                          name='model'
                          defaultValue={editing.model}
                          maxLength={80}
                        />
                      </label>
                      <label>
                        Price in TSh · blank means request price
                        <input
                          name='price'
                          type='number'
                          min={0}
                          max={1e10}
                          step='0.01'
                          defaultValue={editing.price ?? ''}
                        />
                      </label>
                      <label>
                        Condition
                        <select
                          name='condition'
                          defaultValue={editing.condition}
                        >
                          {['New', 'Used', 'Refurbished'].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Availability
                        <select
                          name='availability'
                          defaultValue={editing.availability}
                        >
                          {['Available', 'On request', 'Out of stock'].map(
                            (s) => (
                              <option key={s}>{s}</option>
                            ),
                          )}
                        </select>
                      </label>
                      <label>
                        Publication state
                        <select name='status' defaultValue={editing.status}>
                          {['Draft', 'Published', 'Archived'].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Description
                      <textarea
                        name='description'
                        required
                        maxLength={3000}
                        defaultValue={editing.description}
                      />
                    </label>
                    <label>
                      Specifications · one per line
                      <textarea
                        name='specifications'
                        rows={5}
                        maxLength={4000}
                        defaultValue={editing.specifications}
                        placeholder={'Processor: …\nRAM: …\nStorage: …'}
                      />
                    </label>
                    <label>
                      Warranty details
                      <input
                        name='warranty'
                        maxLength={500}
                        defaultValue={editing.warranty}
                      />
                    </label>
                    <label className='checkbox'>
                      <input
                        type='checkbox'
                        name='featured'
                        defaultChecked={editing.featured}
                      />
                      Feature on homepage
                    </label>
                    <div className='upload-zone'>
                      <ImagePlus size={24} />
                      <label>
                        Upload product images · first image is the main image
                        <input
                          type='file'
                          accept='image/png,image/jpeg,image/webp'
                          multiple
                          disabled={busy}
                          onChange={(e) => void upload(e.target.files)}
                        />
                      </label>
                    </div>
                    <div className='image-previews'>
                      {editing.images.map((path, i) => (
                        <div key={path}>
                          <img
                            src={editing.imageUrls?.[i]}
                            alt={`Product image ${i + 1}`}
                          />
                          <button
                            type='button'
                            onClick={() =>
                              setEditing(
                                (old) =>
                                  old && {
                                    ...old,
                                    images: old.images.filter(
                                      (_, j) => j !== i,
                                    ),
                                    imageUrls: old.imageUrls?.filter(
                                      (_, j) => j !== i,
                                    ),
                                  },
                              )
                            }
                          >
                            Remove image {i + 1}
                          </button>
                          {i > 0 && (
                            <button
                              type='button'
                              onClick={() =>
                                setEditing(
                                  (old) =>
                                    old && {
                                      ...old,
                                      images: [
                                        old.images[i],
                                        ...old.images.filter((_, j) => j !== i),
                                      ],
                                      imageUrls: [
                                        old.imageUrls![i],
                                        ...old.imageUrls!.filter(
                                          (_, j) => j !== i,
                                        ),
                                      ],
                                    },
                                )
                              }
                            >
                              Make main image
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className='fine-print'>
                      Archiving removes a product from the public catalog while
                      preserving request history. Save confirms the selected
                      publication state.
                    </p>
                    <button disabled={busy} className='button primary'>
                      {busy ? 'Saving…' : 'Save product'}
                    </button>
                  </form>
                </div>
              )}
              <div className='table-wrap'>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Status</th>
                      <th>Availability</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.name}
                          <small>
                            {p.category} · {p.condition}
                          </small>
                        </td>
                        <td>{p.status}</td>
                        <td>{p.availability}</td>
                        <td>
                          <button
                            className='text-link'
                            onClick={() => {
                              setEditing(p);
                              setFailure('');
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.products.length && (
                  <p className='empty-inline'>
                    No products yet. Add your first product above.
                  </p>
                )}
              </div>
              {data.productsCursor && (
                <button
                  className='button secondary'
                  onClick={() => load(data.productsCursor!)}
                >
                  Next product page
                </button>
              )}
            </>
          )}
          {tab === 'Requests' && (
            <>
              <label>
                Search this request page
                <input
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  placeholder='Reference, name, contact or status'
                />
              </label>
              <div className='table-wrap'>
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Customer</th>
                      <th>Request</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <button
                            className='text-link'
                            onClick={() => setInquiry(r)}
                          >
                            {r.reference}
                          </button>
                        </td>
                        <td>
                          {r.name}
                          <small>{r.contact}</small>
                        </td>
                        <td>
                          {r.kind}
                          <small>{r.productName || r.service}</small>
                        </td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!requests.length && (
                  <p className='empty-inline'>No matching requests.</p>
                )}
              </div>
              {data.requestsCursor && (
                <button
                  className='button secondary'
                  onClick={() => load('', data.requestsCursor!)}
                >
                  Next request page
                </button>
              )}
              {inquiry && (
                <div className='panel'>
                  <div className='split'>
                    <h2>{inquiry.reference}</h2>
                    <button
                      className='icon-button'
                      aria-label='Close request details'
                      onClick={() => setInquiry(null)}
                    >
                      <X />
                    </button>
                  </div>
                  <p>
                    <strong>{inquiry.name}</strong> · {inquiry.contact}
                  </p>
                  <p>
                    {inquiry.kind} · {inquiry.productName || inquiry.service} ·
                    Quantity {inquiry.quantity}
                  </p>
                  {inquiry.productName && (
                    <p>
                      Original displayed price:{' '}
                      {inquiry.price === null
                        ? 'Request price'
                        : `TSh ${inquiry.price.toLocaleString()}`}
                    </p>
                  )}
                  <p className='pre-line'>{inquiry.message}</p>
                  <p>Received {new Date(inquiry.createdAt).toLocaleString()}</p>
                  <p>
                    Company email notification: <b>{inquiry.notification}</b>
                  </p>
                  <button
                    className='button secondary small'
                    disabled={busy || inquiry.notification === 'Sent'}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const r = await api.post(
                          `/api/admin/requests/${inquiry.id}/notify`,
                        );
                        setNotice(`Email notification: ${r.data.notification}`);
                        await load();
                      } catch (e) {
                        setFailure(errorMessage(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Retry email notification
                  </button>
                  <h3>Status history</h3>
                  {inquiry.history.map((h, i) => (
                    <p key={i}>
                      {h.status} · {new Date(h.at).toLocaleString()} ·{' '}
                      {h.reason}
                    </p>
                  ))}
                  {states.some((s) => canTransition(inquiry.status, s)) && (
                    <form onSubmit={setStatus}>
                      <div className='form-grid'>
                        <label>
                          Next status
                          <select name='status'>
                            {states
                              .filter((s) => canTransition(inquiry.status, s))
                              .map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                          </select>
                        </label>
                        <label>
                          Reason
                          <input name='reason' required maxLength={500} />
                        </label>
                      </div>
                      <button className='button primary' disabled={busy}>
                        Update request
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
          {tab === 'Company' && (
            <div className='panel'>
              <h2>Company details</h2>
              <p>
                Only enter verified TECHSAVY information. Blank contact fields
                are hidden from public pages.
              </p>
              <form onSubmit={saveContent}>
                <label>
                  About TECHSAVY
                  <textarea
                    name='about'
                    rows={6}
                    required
                    maxLength={5000}
                    defaultValue={data.content.about}
                  />
                </label>
                <div className='form-grid'>
                  {(
                    ['email', 'phone', 'whatsapp', 'address', 'hours'] as const
                  ).map((key) => (
                    <label key={key}>
                      {key === 'whatsapp'
                        ? 'WhatsApp · country code and digits only'
                        : key.charAt(0).toUpperCase() + key.slice(1)}
                      <input
                        name={key}
                        type={key === 'email' ? 'email' : 'text'}
                        defaultValue={data.content[key]}
                      />
                    </label>
                  ))}
                </div>
                <p className='fine-print'>
                  Email delivery credentials are configured securely outside
                  this public content form.
                </p>
                <button className='button primary' disabled={busy}>
                  Save company details
                </button>
              </form>
            </div>
          )}
          {tab === 'Audit' && (
            <div className='panel'>
              <h2>Change history</h2>
              <p>
                Immutable application events. Actor identifiers are from
                verified sessions.
              </p>
              {audit.map((a) => (
                <p key={a.id}>
                  <strong>{a.action}</strong> · {a.target}
                  <small>
                    {a.at} · {a.actor}
                  </small>
                </p>
              ))}
              {!audit.length && <p>No events recorded yet.</p>}
              {auditCursor && (
                <button
                  className='button secondary'
                  onClick={() => loadAudit(auditCursor)}
                >
                  Next audit page
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
