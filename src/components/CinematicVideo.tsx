import { useEffect, useRef, useState } from 'react';
import './cinematic-video.css';

/**
 * Licensed, muted background footage from Mixkit's free stock video collection.
 * External delivery is best-effort: the photo backdrop always remains available.
 */
export const cinematicClips = [
  {
    label: 'Laptop close-up',
    src: 'https://assets.mixkit.co/videos/preview/mixkit-typing-on-a-laptop-close-up-1781-large.mp4',
    source: 'https://mixkit.co/free-stock-video/typing-on-a-laptop-close-up-1781/',
  },
  {
    label: 'Desktop workstation',
    src: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-308-large.mp4',
    source: 'https://mixkit.co/free-stock-video/man-working-on-his-laptop-308/',
  },
  {
    label: 'Drone camera',
    src: 'https://assets.mixkit.co/videos/preview/mixkit-camera-of-a-drone-focusing-622-large.mp4',
    source: 'https://mixkit.co/free-stock-video/camera-of-a-drone-focusing-622/',
  },
] as const;

export function CinematicVideo({ paused }: { paused: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const current = cinematicClips.filter((clip) => !failed.includes(clip.src))[index % Math.max(1, cinematicClips.length - failed.length)];
  const canPlay = !paused && !reducedMotion && pageVisible && !!current;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(media.matches);
    const onVisibility = () => setPageVisible(!document.hidden);
    onMotion();
    media.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      media.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    if (!canPlay) {
      element.pause();
      return;
    }
    let cancelled = false;
    void element.play().catch(() => { if (!cancelled) setPlaying(false); });
    return () => {
      cancelled = true;
      element.pause();
    };
  }, [canPlay, current?.src]);

  useEffect(() => {
    if (!canPlay || playing || !current) return;
    const timer = window.setTimeout(() => {
      setFailed((items) => items.includes(current.src) ? items : [...items, current.src]);
      setPlaying(false);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [canPlay, current?.src, playing]);

  if (!current || reducedMotion) return null;
  return (
    <div className={'cinematic-video' + (playing && canPlay ? ' is-playing' : '')} aria-hidden='true'>
      <video
        key={current.src}
        ref={videoRef}
        src={current.src}
        muted
        autoPlay={canPlay}
        loop={false}
        playsInline
        preload='metadata'
        disablePictureInPicture
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onWaiting={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setIndex((i) => i + 1); }}
        onError={() => {
          setPlaying(false);
          setFailed((items) => items.includes(current.src) ? items : [...items, current.src]);
        }}
      />
      <div className='cinematic-video-scrim' />
    </div>
  );
}
