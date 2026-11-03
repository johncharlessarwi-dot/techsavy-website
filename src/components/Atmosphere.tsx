import { Cpu, MemoryStick, HardDrive, Network } from 'lucide-react';
export function Atmosphere({ paused }: { paused: boolean }) {
  return (
    <div className={`atmosphere ${paused ? 'paused' : ''}`} aria-hidden='true'>
      <div className='aurora aurora-one' />
      <div className='aurora aurora-two' />
      <div className='grid-field' />
      <div className='circuit circuit-one' />
      <div className='circuit circuit-two' />
      <Cpu className='floating-chip chip-one' />
      <MemoryStick className='floating-chip chip-two' />
      <HardDrive className='floating-chip chip-three' />
      <Network className='floating-chip chip-four' />
    </div>
  );
}
export function DeviceScene() {
  return (
    <div
      className='device-scene'
      aria-label='Illustration of a laptop with a glowing blue screen'
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
