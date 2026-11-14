import { useEffect, useMemo, useState } from 'react';
import './equipment-backdrop.css';

/** Background photo queue: 10 tech categories × 10 photo slots. */
export const equipmentCategories = [
  {
    "label": "drones",
    "query": "drone,technology"
  },
  {
    "label": "desktops",
    "query": "desktop,computer"
  },
  {
    "label": "processors",
    "query": "cpu,processor"
  },
  {
    "label": "keyboards",
    "query": "keyboard,computer"
  },
  {
    "label": "rj45",
    "query": "ethernet,rj45"
  },
  {
    "label": "external-storage",
    "query": "external,hard-drive"
  },
  {
    "label": "coding",
    "query": "coding,computer"
  },
  {
    "label": "servers",
    "query": "server,rack"
  },
  {
    "label": "monitors",
    "query": "monitor,computer"
  },
  {
    "label": "accessories",
    "query": "electronics,accessories"
  }
] as const;

export const equipmentScenes = equipmentCategories.flatMap(({ label, query }) =>
  Array.from({ length: 10 }, (_, index) => ({
    label,
    /** Remote photography slots are best-effort, not a curated asset library. */
    photo: `https://loremflickr.com/1600/900/${query}?lock=${index + 1}`,
  })),
);
const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=1600&q=75';

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
}

export function EquipmentBackdrop({ paused }: { paused: boolean }) {
  const scenes = useMemo(() => shuffled(equipmentScenes), []);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const current = scenes[active];
  const nextIndex = (active + 1) % scenes.length;
  const nextScene = scenes[nextIndex];

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActive((old) => (old + 1) % scenes.length);
      setLoaded(false);
    }, 4300);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, scenes.length]);

  const showFallback = !loaded || failedUrls.includes(current.photo);
  return (
    <div className='equipment-backdrop' aria-hidden='true'>
      <div className='equipment-slide fallback-image active'>
        <img src={FALLBACK_PHOTO} alt='' decoding='async' />
      </div>
      {!showFallback && (
        <div className='equipment-slide active' key={current.photo}>
          <img src={current.photo} alt='' decoding='async' />
        </div>
      )}
      <img
        className='equipment-preload'
        key={current.photo}
        src={current.photo}
        alt=''
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(false); setFailedUrls((old) => old.includes(current.photo) ? old : [...old, current.photo]); }}
      />
      {nextScene && !reducedMotion && <link rel='preload' as='image' href={nextScene.photo} />}
      <div className='equipment-shade' />
    </div>
  );
}
