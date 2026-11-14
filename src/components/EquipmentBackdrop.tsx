import { useEffect, useState } from 'react';
import './equipment-backdrop.css';

/** Real equipment photography, free to use under the Unsplash license. */
export const equipmentScenes = [
  { label: 'Computer workstation and laptop', photo: 'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=1800&q=78', credit: 'Dell / Unsplash' },
  { label: 'Camera equipment and editing monitors', photo: 'https://images.unsplash.com/photo-1757845524683-611470b2d7ce?auto=format&fit=crop&w=1800&q=78', credit: 'Jakub Żerdzicki / Unsplash' },
  { label: 'Server infrastructure and equipment racks', photo: 'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?auto=format&fit=crop&w=1800&q=78', credit: 'Eric Stoynov / Unsplash' },
  { label: 'Dual monitor computer workstation', photo: 'https://images.unsplash.com/photo-1659083475067-8ab6af362082?auto=format&fit=crop&w=1800&q=78', credit: 'Ritupon Baishya / Unsplash' },
] as const;

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
