import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Camera, CircuitBoard, Code2, Cpu, Drone, HardDrive, Keyboard, Monitor, Network, Server } from 'lucide-react';
import './tech-universe.css';

const universes = [
  { title: 'The Drone Lab', subtitle: 'Precision from above', category: 'Aerial technology', photo: 'https://loremflickr.com/1200/900/drone,quadcopter?lock=41', Icon: Drone, link: '#contact' },
  { title: 'Workstation Culture', subtitle: 'Power for every creator', category: 'Desktop computing', photo: 'https://images.unsplash.com/photo-1659083475067-8ab6af362082?auto=format&fit=crop&w=1100&q=80', Icon: Monitor, link: '#products' },
  { title: 'Inside the Machine', subtitle: 'Performance at the core', category: 'CPUs & components', photo: 'https://loremflickr.com/1200/900/computer,processor?lock=43', Icon: Cpu, link: '#products' },
  { title: 'Built to Type', subtitle: 'Every keystroke matters', category: 'Keyboards', photo: 'https://loremflickr.com/1200/900/mechanical,keyboard?lock=44', Icon: Keyboard, link: '#products' },
  { title: 'Every Connection Counts', subtitle: 'Infrastructure in motion', category: 'RJ45 & networks', photo: 'https://loremflickr.com/1200/900/ethernet,cable?lock=45', Icon: Network, link: '#services' },
  { title: 'Data Everywhere', subtitle: 'Carry more possibilities', category: 'External storage', photo: 'https://loremflickr.com/1200/900/portable,harddrive?lock=46', Icon: HardDrive, link: '#products' },
  { title: 'Made to Create', subtitle: 'Code without boundaries', category: 'Code & software', photo: 'https://loremflickr.com/1200/900/programming,computer?lock=47', Icon: Code2, link: '#services' },
  { title: 'The Digital Backbone', subtitle: 'Built for the big picture', category: 'Servers', photo: 'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?auto=format&fit=crop&w=1100&q=80', Icon: Server, link: '#services' },
  { title: 'Capture Everything', subtitle: 'From idea to image', category: 'Cameras', photo: 'https://loremflickr.com/1200/900/digital,camera?lock=49', Icon: Camera, link: '#contact' },
  { title: 'Future Ready', subtitle: 'Small parts. Big potential.', category: 'Tech accessories', photo: 'https://loremflickr.com/1200/900/computer,electronics?lock=50', Icon: CircuitBoard, link: '#products' },
] as const;

export function TechUniverse() {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<number[]>([]);
  const [autoPlay, setAutoPlay] = useState(false);
  const scene = universes[active];
  const change = (delta: number) => setActive((value) => (value + delta + universes.length) % universes.length);

  useEffect(() => {
    if (!autoPlay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % universes.length);
    }, 6800);
    return () => window.clearInterval(timer);
  }, [autoPlay]);

  return (
    <section className='tech-universe section container' aria-labelledby='tech-universe-title'>
      <div className='tech-universe-header'>
        <div><span className='eyebrow'>TECHSAVY VISUAL UNIVERSE / 001—010</span>
          <h2 id='tech-universe-title'>Explore the <em>extraordinary.</em></h2>
        </div>
        <div className='tech-universe-controls'>
          <button type='button' onClick={() => change(-1)} aria-label='Previous technology category'><ArrowLeft size={19} /></button>
          <button type='button' onClick={() => change(1)} aria-label='Next technology category'><ArrowRight size={19} /></button>
        </div>
      </div>
      <div className='tech-universe-layout'>
        <div className='tech-universe-stage' aria-live='polite'>
          {!failed.includes(active) && (
            <img key={scene.photo} src={scene.photo} alt='' loading='lazy' decoding='async'
              onError={() => setFailed((items) => items.includes(active) ? items : [...items, active])} />
          )}
          <div className='tech-universe-overlay' />
          <span className='tech-universe-index'>{String(active + 1).padStart(2, '0')} / {String(universes.length).padStart(2, '0')}</span>
          <div className='tech-universe-caption'>
            <span className='eyebrow'>{scene.category}</span>
            <h3>{scene.title}</h3>
            <p>{scene.subtitle}</p>
            <a href={scene.link} className='tech-universe-link'>Explore solutions <ArrowUpRight size={19} /></a>
          </div>
        </div>
        <div className='tech-universe-rail' aria-label='Technology categories'>
          {universes.map(({ category, Icon }, index) => (
            <button key={category} className={active === index ? 'active' : ''}
              type='button' aria-pressed={active === index} onClick={() => setActive(index)}>
              <Icon size={20} strokeWidth={1.55} aria-hidden='true' />
              <span>{category}</span>
              <small>{String(index + 1).padStart(2, '0')}</small>
            </button>
          ))}
        </div>
      </div>
      <div className='tech-universe-footer'>
        <span>10 WORLDS OF TECHNOLOGY · EXPLORE AT YOUR PACE</span>
        <button type='button' aria-pressed={autoPlay} onClick={() => setAutoPlay((value) => !value)}>
          {autoPlay ? 'Pause gallery' : 'Auto-play gallery'}
        </button>
      </div>
    </section>
  );
}
