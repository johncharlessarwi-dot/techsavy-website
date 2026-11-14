import { useEffect, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Laptop,
  Monitor,
  Headphones,
  Network,
  HardDrive,
  Wrench,
  ShieldCheck,
  Package,
  Cpu,
  Search,
  Pause,
  Play,
  Mail,
  Phone,
  MapPin,
  Clock,
  Check,
  ChevronLeft,
} from 'lucide-react';
import {
  categories,
  services,
  defaultContent,
  createUuid,
} from '../shared/domain';
import type { Product, SiteContent } from '../shared/domain';
import { Atmosphere, DeviceScene } from './components/Atmosphere';
import { RequestForm, errorMessage } from './components/RequestForm';
import { Admin } from './components/Admin';
import {
  useCatalogChoices,
  ProductComparison,
} from './components/CatalogChoices';
import { sortCatalog } from '../shared/catalog';
import type { CatalogSort } from '../shared/catalog';

const icons = [Laptop, Monitor, Monitor, Headphones, Network, HardDrive];
const getRoute = () => window.location.hash.slice(1) || 'home';
const money = (price: number | null) =>
  price === null ? 'Request price' : `TSh ${price.toLocaleString('en-TZ')}`;
export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [menu, setMenu] = useState(false);
  const [paused, setPaused] = useState(
    () => localStorage.getItem('techsavy-motion') === 'paused',
  );
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CatalogSort>('featured');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const choices = useCatalogChoices();
  const [category, setCategory] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [selected, setSelected] = useState<Product | null>(null);
  const [request, setRequest] = useState<{
    kind: string;
    productId?: string;
    productName?: string;
    service?: string;
  } | null>(null);
  const [analytics, setAnalytics] = useState(
    () => localStorage.getItem('techsavy-analytics') || '',
  );

  useEffect(() => {
    const change = () => {
      setRoute(getRoute());
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  async function loadProducts(next = '') {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get(
        `/api/products${next ? `?cursor=${encodeURIComponent(next)}` : ''}`,
      );
      setProducts((old) =>
        next
          ? [...new Map([...old, ...data.items].map((p) => [p.id, p])).values()]
          : data.items,
      );
      setCursor(data.cursor);
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadProducts();
    api
      .get('/api/content')
      .then((r) => setContent(r.data))
      .catch(() => {
        /* Default company intro remains usable. */
      });
  }, []);
  useEffect(() => {
    document.title = `TECHSAVY | ${route.charAt(0).toUpperCase() + route.slice(1)} · Computers & IT`;
    if (
      analytics !== 'yes' ||
      route === 'admin' ||
      !['home', 'products', 'services', 'about', 'contact'].includes(route)
    )
      return;
    let visitor = localStorage.getItem('techsavy-visitor');
    if (!visitor) {
      visitor = createUuid();
      localStorage.setItem('techsavy-visitor', visitor);
    }
    const trackingKey = `${route}-${Date.now()}`;
    // Authenticated admin browsing is excluded from public metrics.
    let cancelled = false;
    auth
      .getUser()
      .then((user) => {
        if (!user && !cancelled)
          void api
            .post('/api/visit', { visitor, route, consent: true, trackingKey })
            .catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [route, analytics]);
  useEffect(() => {
    if (!request) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLDialogElement>('#request-dialog');
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, [request]);
  const filtered = sortCatalog(
    products.filter(
      (p) =>
        (!favoritesOnly || choices.favorites.includes(p.id)) &&
        (category === 'All' || p.category === category) &&
        (availability === 'All' || p.availability === availability) &&
        `${p.name} ${p.brand} ${p.model}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ),
    sort,
  );
  const productCards = (items: Product[]) => (
    <div className='product-grid'>
      {items.map((p) => (
        <article className='product-card-wrap' key={p.id}>
          <button
            className='product-card'
            key={p.id}
            onClick={async () => {
              window.location.hash = 'products';
              setLoadError('');
              try {
                const result = await api.get(
                  `/api/products/${encodeURIComponent(p.id)}`,
                );
                setSelected(result.data);
              } catch (e) {
                setLoadError(errorMessage(e));
              }
            }}
          >
            <div className='product-image'>
              {p.imageUrls?.[0] ? (
                <img src={p.imageUrls[0]} alt={p.name} loading='lazy' />
              ) : (
                <Laptop size={64} />
              )}
              <span className='condition'>{p.condition}</span>
            </div>
            <div className='product-info'>
              <span className='eyebrow'>{p.category}</span>
              <h3>{p.name}</h3>
              <p>
                {p.brand} {p.model}
              </p>
              <div className='split'>
                <b>{money(p.price)}</b>
                <ArrowUpRight size={20} />
              </div>
              <small>{p.availability}</small>
            </div>
          </button>
          <div className='product-choice-actions'>
            <button
              aria-pressed={choices.favorites.includes(p.id)}
              aria-label={`${choices.favorites.includes(p.id) ? 'Unsave' : 'Save'} ${p.name}`}
              onClick={() => choices.toggleFavorite(p.id)}
            >
              {choices.favorites.includes(p.id) ? 'Saved ♥' : 'Save ♡'}
            </button>
            <button
              aria-pressed={choices.compare.includes(p.id)}
              disabled={
                !choices.compare.includes(p.id) && choices.compare.length >= 3
              }
              aria-label={`Compare ${p.name}`}
              onClick={() => {
                choices.toggleCompare(p.id);
                setSelected(null);
                window.location.hash = 'products';
              }}
            >
              {choices.compare.includes(p.id)
                ? 'Selected to compare'
                : 'Compare'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
  function selectCategory(c: string) {
    setCategory(c);
    window.location.hash = 'products';
  }
  function toggleMotion() {
    setPaused((p) => {
      localStorage.setItem('techsavy-motion', p ? 'running' : 'paused');
      return !p;
    });
  }
  function consent(value: string) {
    localStorage.setItem('techsavy-analytics', value);
    setAnalytics(value);
    if (value !== 'yes') localStorage.removeItem('techsavy-visitor');
  }

  return (
    <div className={paused ? 'site motion-paused' : 'site'}>
      <Atmosphere paused={paused} />
      <a
        className='skip-link'
        href='#main-content'
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <div className='topbar'>
        <span>COMPUTERS. CONNECTIONS. POSSIBILITIES.</span>
        <a href='#contact'>
          Let’s talk technology <ArrowUpRight size={12} />
        </a>
      </div>
      <header className='header'>
        <a className='brand' href='#home' aria-label='TECHSAVY home'>
          <span className='brand-mark'>
            t<span>/</span>
          </span>
          <span>
            techsavy<span className='brand-dot'>.</span>
          </span>
        </a>
        <nav aria-label='Main navigation' className={menu ? 'nav open' : 'nav'}>
          {['home', 'products', 'services', 'about', 'contact'].map((page) => (
            <a
              key={page}
              href={`#${page}`}
              onClick={() => setSelected(null)}
              aria-current={route === page ? 'page' : undefined}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </a>
          ))}
        </nav>
        <div className='header-actions'>
          <button
            className='icon-button motion-button'
            onClick={toggleMotion}
            aria-label={
              paused
                ? 'Play background animations'
                : 'Pause background animations'
            }
            title={paused ? 'Play animations' : 'Pause animations'}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            className='button small primary header-quote'
            onClick={() => setRequest({ kind: 'Quotation' })}
          >
            Get a quote <ArrowUpRight size={16} />
          </button>
          <button
            className='icon-button mobile-toggle'
            aria-expanded={menu}
            aria-label='Toggle navigation'
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id='main-content' tabIndex={-1}>
        {route === 'home' && (
          <>
            <section className='hero container'>
              <div className='hero-copy'>
                <span className='eyebrow pill'>
                  <span className='status-dot' /> YOUR NEXT CHAPTER STARTS HERE
                </span>
                <h1>
                  Good tech.
                  <br />
                  Great <span className='gradient-text'>possibilities.</span>
                </h1>
                <p>
                  Computers, accessories and IT expertise.
                  <br className='desktop-break' /> Everything you need to work
                  smarter, create more and keep moving.
                </p>
                <div className='actions'>
                  <a href='#products' className='button primary'>
                    Explore products <ArrowUpRight size={18} />
                  </a>
                  <a href='#services' className='button secondary'>
                    Our IT services <ArrowRight size={17} />
                  </a>
                </div>
                <div className='hero-footnote'>
                  <ShieldCheck size={18} />
                  <span>For individuals, teams and growing businesses.</span>
                </div>
              </div>
              <DeviceScene />
            </section>
            <div className='value-strip container'>
              <div>
                <Package />
                <span>
                  Hardware & accessories<small>Find the right fit</small>
                </span>
              </div>
              <div>
                <Wrench />
                <span>
                  Practical IT support<small>Keep things running</small>
                </span>
              </div>
              <div>
                <Network />
                <span>
                  Business & bulk supply
                  <small>Built around your requirements</small>
                </span>
              </div>
            </div>
            <section className='section container'>
              <div className='section-head'>
                <div>
                  <span className='eyebrow'>FIND YOUR UPGRADE</span>
                  <h2>
                    A world of tech.
                    <br />
                    One place to start.
                  </h2>
                </div>
                <a className='text-link' href='#products'>
                  Explore the catalog <ArrowUpRight size={18} />
                </a>
              </div>
              <div className='category-grid'>
                {categories.map((c, i) => {
                  const Icon = icons[i];
                  return (
                    <button
                      key={c}
                      className='category-card'
                      onClick={() => selectCategory(c)}
                    >
                      <span className='category-art'>
                        <Icon strokeWidth={1.3} />
                      </span>
                      <span>
                        {c}
                        <ArrowUpRight size={17} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            {products.some((p) => p.featured) && (
              <section className='section container'>
                <div className='section-head'>
                  <div>
                    <span className='eyebrow'>SELECTED BY TECHSAVY</span>
                    <h2>In the spotlight.</h2>
                  </div>
                </div>
                {productCards(products.filter((p) => p.featured).slice(0, 3))}
              </section>
            )}
            <section className='service-teaser container'>
              <div>
                <span className='eyebrow'>MORE THAN HARDWARE</span>
                <h2>
                  Tech trouble?
                  <br />
                  <span className='muted'>Let’s sort it out.</span>
                </h2>
                <p>
                  From a computer that won’t start to a network that needs a
                  fresh approach, tell us what’s getting in your way.
                </p>
                <a className='button secondary' href='#services'>
                  Explore our services <ArrowUpRight size={18} />
                </a>
              </div>
              <div className='service-list'>
                {services.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setRequest({ kind: 'Service', service: s })}
                  >
                    <span className='service-number'>0{i + 1}</span>
                    <span>{s}</span>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
              </div>
            </section>
            <section className='cta container'>
              <span className='eyebrow'>YOUR IDEAS. THE RIGHT EQUIPMENT.</span>
              <h2>Let’s build what’s next.</h2>
              <p>One laptop or an entire office. Start with a conversation.</p>
              <button
                className='button primary'
                onClick={() => setRequest({ kind: 'Quotation' })}
              >
                Request a quotation <ArrowUpRight size={18} />
              </button>
            </section>
          </>
        )}
        {route === 'products' && (
          <section className='section container page-section'>
            {selected ? (
              <>
                <button
                  className='text-link back'
                  onClick={() => setSelected(null)}
                >
                  <ChevronLeft size={18} />
                  Back to products
                </button>
                <div className='product-detail'>
                  <div className='gallery'>
                    {selected.imageUrls?.map((url, i) => (
                      <img
                        key={url}
                        src={url}
                        alt={`${selected.name}, view ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div>
                    <span className='eyebrow'>
                      {selected.category} / {selected.condition}
                    </span>
                    <h1>{selected.name}</h1>
                    <p>{selected.description}</p>
                    <h2>{money(selected.price)}</h2>
                    <p className='availability'>
                      <Check size={16} />
                      {selected.availability}
                    </p>
                    <button
                      className='button primary'
                      disabled={selected.availability === 'Out of stock'}
                      onClick={() =>
                        setRequest({
                          kind: 'Product',
                          productId: selected.id,
                          productName: selected.name,
                        })
                      }
                    >
                      Request this product <ArrowUpRight size={18} />
                    </button>
                    <h3>Specifications</h3>
                    <p className='pre-line'>
                      {selected.specifications ||
                        'Ask our team for detailed specifications.'}
                    </p>
                    {selected.warranty && (
                      <>
                        <h3>Warranty</h3>
                        <p>{selected.warranty}</p>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className='eyebrow'>HARDWARE FOR YOUR NEXT MOVE</span>
                <h1>Find your fit.</h1>
                <p className='lead'>
                  Explore available equipment or tell us what you’re looking
                  for.
                </p>
                <div className='catalog-tools'>
                  <label className='search-field'>
                    <Search size={18} />
                    <input
                      aria-label='Search products'
                      placeholder='Search names, brands or models…'
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  {query && (
                    <button className='catalog-clear-search' type='button' onClick={() => setQuery('')} aria-label='Clear product search'>
                      <X size={16} /> Clear search
                    </button>
                  )}
                  <select
                    aria-label='Product category'
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>All</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    aria-label='Availability'
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  >
                    <option>All</option>
                    <option>Available</option>
                    <option>On request</option>
                    <option>Out of stock</option>
                  </select>
                </div>
                <div className='catalog-preferences'>
                  <label>
                    Sort products
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as CatalogSort)}
                    >
                      <option value='featured'>Featured first</option>
                      <option value='price-low'>Price: low to high</option>
                      <option value='price-high'>Price: high to low</option>
                      <option value='name'>Name: A–Z</option>
                    </select>
                  </label>
                  <label className='favorites-filter'>
                    <input
                      type='checkbox'
                      checked={favoritesOnly}
                      onChange={(e) => setFavoritesOnly(e.target.checked)}
                    />{' '}
                    Favourites only ({choices.favorites.length} saved)
                  </label>
                </div>
                <p className='catalog-note'>
                  Favourites are saved in this browser. Filters, sorting and
                  comparison use loaded products; load more to include the next
                  catalog page.
                </p>
                <p className='catalog-note' role='status'>
                  {choices.notice ||
                    `${filtered.length} matching loaded products · ${choices.compare.length} selected for comparison`}
                </p>
                <ProductComparison
                  products={products.filter((p) =>
                    choices.compare.includes(p.id),
                  )}
                  onRemove={choices.toggleCompare}
                  onClear={choices.clearCompare}
                  onRequest={(p) =>
                    setRequest({
                      kind: 'Product',
                      productId: p.id,
                      productName: p.name,
                    })
                  }
                />
                {loadError && (
                  <div className='error' role='alert'>
                    {loadError}
                    <button onClick={() => loadProducts()}>
                      Retry catalog
                    </button>
                  </div>
                )}
                {loading && !products.length ? (
                  <p role='status'>Loading products…</p>
                ) : filtered.length ? (
                  productCards(filtered)
                ) : (
                  <div className='empty-state'>
                    <Package size={42} />
                    <h2>
                      {products.length
                        ? 'No matching products.'
                        : 'Your next upgrade starts with a request.'}
                    </h2>
                    <p>
                      {products.length
                        ? 'Try a different search or category.'
                        : 'Our online catalog is being prepared. Tell us your requirements and the team can help you find the right equipment.'}
                    </p>
                    <div className='actions'>
                      <button
                        className='button primary'
                        onClick={() => setRequest({ kind: 'Quotation' })}
                      >
                        Request a quotation <ArrowUpRight size={18} />
                      </button>
                      {products.length > 0 && (
                        <button
                          className='button secondary'
                          onClick={() => {
                            setQuery('');
                            setCategory('All');
                            setAvailability('All');
                            setFavoritesOnly(false);
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {cursor && (
                  <div className='load-more'>
                    <p>
                      Search applies to loaded products. Load more to search the
                      next catalog page.
                    </p>
                    <button
                      className='button secondary'
                      disabled={loading}
                      onClick={() => loadProducts(cursor)}
                    >
                      Load more products
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
        {route === 'services' && (
          <section className='section container page-section'>
            <span className='eyebrow'>PRACTICAL HELP. REAL PROGRESS.</span>
            <h1>
              Keep your tech
              <br />
              <span className='gradient-text'>moving forward.</span>
            </h1>
            <p className='lead'>
              Support for your devices, your network and the way you work.
            </p>
            <div className='services-grid'>
              {services.map((s, i) => {
                const Icon = [
                  Wrench,
                  Network,
                  Cpu,
                  HardDrive,
                  Headphones,
                  ShieldCheck,
                ][i];
                return (
                  <article className='service-card' key={s}>
                    <Icon size={30} />
                    <span className='service-number'>0{i + 1}</span>
                    <h2>{s}</h2>
                    <p>
                      {
                        [
                          'Diagnose device problems and discuss the right repair before work begins.',
                          'Plan, install or troubleshoot connections for home and business.',
                          'Get help installing and configuring software you are licensed to use.',
                          'Explore backup options and assess recovery possibilities. Recovery cannot be guaranteed.',
                          'Get practical help with everyday technology challenges.',
                          'Arrange servicing and preventive care to keep your equipment working.',
                        ][i]
                      }
                    </p>
                    <button
                      className='text-link'
                      onClick={() =>
                        setRequest({ kind: 'Service', service: s })
                      }
                    >
                      Request this service <ArrowUpRight size={18} />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {route === 'about' && (
          <section className='section container page-section'>
            <span className='eyebrow'>MEET TECHSAVY</span>
            <h1>
              Technology with
              <br />
              <span className='gradient-text'>a human side.</span>
            </h1>
            <div className='about-grid'>
              <div>
                <p className='lead pre-line'>{content.about}</p>
                <p>
                  For an individual upgrade, equipment for your team, or support
                  for the systems you rely on, start by telling us what you
                  need.
                </p>
                <a className='button primary' href='#contact'>
                  Start a conversation <ArrowUpRight size={18} />
                </a>
              </div>
              <div className='about-visual'>
                <Cpu size={110} strokeWidth={0.8} />
                <span>HARDWARE + EXPERTISE</span>
                <h2>
                  One connected
                  <br />
                  approach.
                </h2>
              </div>
            </div>
          </section>
        )}
        {route === 'contact' && (
          <section className='section container page-section'>
            <div className='contact-grid'>
              <div>
                <span className='eyebrow'>LET’S TALK</span>
                <h1>
                  Big idea?
                  <br />
                  Small question?
                  <br />
                  <span className='gradient-text'>We’re listening.</span>
                </h1>
                <p className='lead'>
                  Tell us about your next purchase, your business requirements
                  or a technology problem.
                </p>
                <div className='contact-details'>
                  {content.email && (
                    <a href={`mailto:${content.email}`}>
                      <Mail />
                      {content.email}
                    </a>
                  )}
                  {content.phone && (
                    <p>
                      <Phone />
                      {content.phone}
                    </p>
                  )}
                  {content.address && (
                    <p>
                      <MapPin />
                      {content.address}
                    </p>
                  )}
                  {content.hours && (
                    <p>
                      <Clock />
                      {content.hours}
                    </p>
                  )}
                  {content.whatsapp && (
                    <a
                      href={`https://wa.me/${content.whatsapp}`}
                      target='_blank'
                      rel='noreferrer'
                    >
                      Chat on WhatsApp <ArrowUpRight size={18} />
                    </a>
                  )}
                </div>
              </div>
              <RequestForm kind='Contact' />
            </div>
          </section>
        )}
        {route === 'admin' && (
          <Admin
            onContent={setContent}
            onProducts={() => void loadProducts()}
          />
        )}
        {![
          'home',
          'products',
          'services',
          'about',
          'contact',
          'admin',
        ].includes(route) && (
          <section className='section container'>
            <h1>Page not found.</h1>
            <a className='button primary' href='#home'>
              Back to home
            </a>
          </section>
        )}
      </main>
      <footer className='footer container'>
        <div className='footer-top'>
          <a className='brand' href='#home'>
            <span className='brand-mark'>
              t<span>/</span>
            </span>
            <span>techsavy.</span>
          </a>
          <p>Good tech. Great possibilities.</p>
          <a className='text-link' href='#contact'>
            Start something <ArrowUpRight size={18} />
          </a>
        </div>
        <div className='footer-bottom'>
          <span>© {new Date().getFullYear()} TECHSAVY</span>
          <div>
            <button onClick={() => setAnalytics('')}>
              Privacy preferences
            </button>
            <a href='#admin'>Admin</a>
            <span>COMPUTERS & IT SERVICES</span>
          </div>
        </div>
      </footer>
      {!analytics && route !== 'admin' && (
        <div
          className='consent-banner'
          role='region'
          aria-label='Privacy preferences'
        >
          <p>
            <b>Your privacy, your choice.</b> Allow anonymous browser
            identifiers to help us count visits? Contact forms work either way.
          </p>
          <div>
            <button onClick={() => consent('no')}>Decline</button>
            <button
              className='button small primary'
              onClick={() => consent('yes')}
            >
              Allow analytics
            </button>
          </div>
        </div>
      )}
      {request && (
        <dialog id='request-dialog' onCancel={() => setRequest(null)}>
          <RequestForm {...request} onClose={() => setRequest(null)} />
        </dialog>
      )}
    </div>
  );
}
