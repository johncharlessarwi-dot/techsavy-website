import { useEffect, useState } from 'react';
import type { Product } from '../../shared/domain';
import { readFavoriteIds } from '../../shared/catalog';
import './catalog-choices.css';

export function useCatalogChoices() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return readFavoriteIds(localStorage.getItem('techsavy-favorites'));
    } catch {
      return [];
    }
  });
  const [compare, setCompare] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    try {
      localStorage.setItem('techsavy-favorites', JSON.stringify(favorites));
    } catch {
      setNotice(
        'Browser storage is unavailable. Favourites will last for this visit only.',
      );
    }
  }, [favorites]);
  function toggleFavorite(id: string) {
    setFavorites((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id].slice(-200),
    );
  }
  function toggleCompare(id: string) {
    setCompare((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : old.length < 3
          ? [...old, id]
          : old,
    );
  }
  return {
    favorites,
    compare,
    notice,
    toggleFavorite,
    toggleCompare,
    clearCompare: () => setCompare([]),
  };
}

export function ProductComparison({
  products,
  onRemove,
  onClear,
  onRequest,
}: {
  products: Product[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onRequest: (product: Product) => void;
}) {
  if (!products.length) return null;
  const rows: { label: string; value: (p: Product) => string }[] = [
    {
      label: 'Price',
      value: (p) =>
        p.price === null
          ? 'Request price'
          : `TSh ${p.price.toLocaleString('en-TZ')}`,
    },
    { label: 'Category', value: (p) => p.category },
    {
      label: 'Brand / model',
      value: (p) =>
        [p.brand, p.model].filter(Boolean).join(' ') || 'Not specified',
    },
    { label: 'Condition', value: (p) => p.condition },
    { label: 'Availability', value: (p) => p.availability },
    {
      label: 'Specifications',
      value: (p) => p.specifications || 'Ask our team',
    },
    { label: 'Warranty', value: (p) => p.warranty || 'Ask our team' },
  ];
  return (
    <section className='comparison-panel' aria-labelledby='comparison-title'>
      <div className='split'>
        <h2 id='comparison-title'>Compare equipment ({products.length}/3)</h2>
        <button className='text-link' onClick={onClear}>
          Clear comparison
        </button>
      </div>
      <p>
        Select up to three products. Scroll the table sideways on smaller
        screens.
      </p>
      <div
        className='comparison-scroll'
        role='region'
        aria-label='Product comparison table'
        tabIndex={0}
      >
        <table>
          <caption className='sr-only'>
            Selected equipment specifications and prices
          </caption>
          <thead>
            <tr>
              <th scope='col'>Feature</th>
              {products.map((p) => (
                <th scope='col' key={p.id}>
                  {p.name}
                  <button
                    className='compare-remove'
                    aria-label={`Remove ${p.name} from comparison`}
                    onClick={() => onRemove(p.id)}
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope='row'>{row.label}</th>
                {products.map((p) => (
                  <td key={p.id}>{row.value(p)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope='row'>Enquiry</th>
              {products.map((p) => (
                <td key={p.id}>
                  <button
                    className='button secondary'
                    disabled={p.availability === 'Out of stock'}
                    onClick={() => onRequest(p)}
                  >
                    Request {p.name}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
