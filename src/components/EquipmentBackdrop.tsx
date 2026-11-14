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
export function EquipmentBackdrop({ paused }: { paused: boolean }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setActive((old) => (old + 1) % equipmentScenes.length), 9500);
    return () => window.clearInterval(id);
  }, [paused]);
  return (
    <div className='equipment-backdrop' aria-hidden='true'>
      {equipmentScenes.map((scene, index) => (
        <div key={scene.photo} className={'equipment-slide' + (index === active ? ' active' : '')}>
          <img src={scene.photo} alt='' loading={index === 0 ? 'eager' : 'lazy'} decoding='async' referrerPolicy='no-referrer' />
        </div>
      ))}
      <div className='equipment-shade' />
    </div>
  );
}
