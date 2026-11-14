import { ArrowUpRight, HardDrive, Laptop2, Server } from 'lucide-react';
import './premium-showcase.css';

const showcases = [
  {
    title: 'Computing without compromise',
    caption: 'Laptops · Workstations · Accessories',
    image: 'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=1200&q=78',
    icon: Laptop2,
    href: '#products',
  },
  {
    title: 'Connected for what comes next',
    caption: 'Networking · Infrastructure · Support',
    image: 'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?auto=format&fit=crop&w=1200&q=78',
    icon: Server,
    href: '#services',
  },
  {
    title: 'Technology that works harder',
    caption: 'Storage · Upgrades · Business Supply',
    image: 'https://images.unsplash.com/photo-1659083475067-8ab6af362082?auto=format&fit=crop&w=1200&q=78',
    icon: HardDrive,
    href: '#contact',
  },
];

export function PremiumShowcase() {
  return (
    <section className='premium-showcase section container' aria-labelledby='premium-showcase-title'>
      <div className='premium-showcase-heading'>
        <span className='eyebrow'>DISCOVER THE TECHSAVY EXPERIENCE</span>
        <h2 id='premium-showcase-title'>Made for the way <em>you work.</em></h2>
        <p>Purpose-built technology and reliable equipment sourcing for individuals and growing businesses.</p>
      </div>
      <div className='premium-showcase-grid'>
        {showcases.map(({ title, caption, image, href, icon: Icon }) => (
          <a className='premium-showcase-card' href={href} key={title}>
            <img src={image} alt='' loading='lazy' decoding='async' />
            <span className='premium-showcase-shade' />
            <span className='premium-showcase-body'>
              <Icon size={25} strokeWidth={1.5} aria-hidden='true' />
              <span className='premium-showcase-title'>{title}</span>
              <span className='premium-showcase-caption'>{caption}</span>
              <span className='premium-showcase-arrow'><ArrowUpRight size={20} aria-hidden='true' /></span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
