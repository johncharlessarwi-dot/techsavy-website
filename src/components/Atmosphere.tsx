import { EquipmentBackdrop } from './EquipmentBackdrop';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Laptop,
  Monitor,
  Camera,
  Server,
  EthernetPort,
} from 'lucide-react';

function Drone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 160 120'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M66 49 37 29M94 49l29-20M66 71 37 91M94 71l29 20' />
      <rect x='61' y='41' width='38' height='38' rx='12' />
      <path d='M73 79v10h14V79M74 51h12M68 88l-6 9m30-9 6 9' />
      {[
        [30, 23],
        [130, 23],
        [30, 97],
        [130, 97],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <ellipse cx={cx} cy={cy} rx='24' ry='17' opacity='.45' />
          <g className='drone-rotor'>
            <path d={`M${cx - 19} ${cy}h38M${cx} ${cy - 13}v26`} />
          </g>
          <circle cx={cx} cy={cy} r='3' />
        </g>
      ))}
    </svg>
  );
}

const devices = [
  { Icon: Laptop, name: 'laptop', label: 'MOBILE COMPUTING' },
  { Icon: Drone, name: 'drone', label: 'AERIAL TECHNOLOGY' },
  { Icon: EthernetPort, name: 'ethernet', label: 'CONNECTED SYSTEMS' },
  { Icon: Monitor, name: 'desktop', label: 'DESKTOP WORKSTATIONS' },
  { Icon: Camera, name: 'camera', label: 'DIGITAL IMAGING' },
  { Icon: Server, name: 'server', label: 'SERVER INFRASTRUCTURE' },
  { Icon: Cpu, name: 'processor', label: 'PROCESSING POWER' },
  { Icon: MemoryStick, name: 'memory', label: 'MEMORY & COMPONENTS' },
  { Icon: HardDrive, name: 'storage', label: 'DATA STORAGE' },
];
export function Atmosphere({ paused }: { paused: boolean }) {
  return (
    <div className={`atmosphere ${paused ? 'paused' : ''}`} aria-hidden='true'>
      <EquipmentBackdrop paused={paused} />
      <div className='aurora aurora-one' />
      <div className='aurora aurora-two' />
      <div className='grid-field' />
      <div className='circuit circuit-one' />
      <div className='circuit circuit-two' />

    </div>
  );
}
export function DeviceScene() {
  return (
    <div
      className='device-scene'
      aria-label='Illustration of a laptop with a glowing golden yellow screen'
      role='img'
    >
      <div className='orbit orbit-one' />
      <div className='orbit orbit-two' />
      <div className='device-tag tag-top'>
        <span className='status-dot' /> BUILT AROUND YOUR NEEDS
      </div>
      <div className='laptop'>
        <div className='laptop-screen'>
          <div className='screen-glow' />
          <div className='screen-lines' />
          <span className='screen-brand'>
            t<span> / </span>
          </span>
          <span className='screen-caption'>AHEAD OF WHAT’S NEXT.</span>
        </div>
        <div className='laptop-base'>
          <div className='trackpad' />
        </div>
      </div>
      <div className='device-tag tag-bottom'>
        <Cpu size={20} />
        <div>
          <b>More possibility.</b>
          <small>One smart upgrade.</small>
        </div>
      </div>
      <span className='scene-label'>COMPUTERS · COMPONENTS · CONNECTIONS</span>
    </div>
  );
}
