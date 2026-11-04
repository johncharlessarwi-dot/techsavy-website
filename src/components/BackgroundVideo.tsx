import { useEffect, useRef, useState } from 'react';
import './background-video.css';

export type BackgroundClip = {
  src: string;
  device: string;
  source: string;
  license: string;
};

// Populate only after licensed video files have been uploaded and bound.
// Twelve distinct devices, at most 20 seconds each, form a four-minute cycle.
export const backgroundClips: BackgroundClip[] = [];
const clips = backgroundClips.filter((clip) =>
  /^\/resources\/[a-z0-9/_-]+\.(mp4|webm)$/i.test(clip.src),
);

export function BackgroundVideo({ paused }: { paused: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [sequence, setSequence] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hidden, setHidden] = useState(() => document.hidden);
  const available = clips.filter((clip) => !failed.includes(clip.src));
  const current = available[sequence % available.length];
  const stopped = paused || reducedMotion || hidden;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setHidden(document.hidden);
    updateMotion();
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (stopped) {
      element.pause();
    } else {
      let cancelled = false;
      element.muted = true;
      void element.play().catch(() => {
        if (!cancelled) setReady(false);
      });
      return () => {
        cancelled = true;
        element.pause();
      };
    }
  }, [stopped, current?.src, sequence]);

  useEffect(() => {
    if (!current || stopped || ready) return;
    // A missing or stalled clip must not leave an empty background forever.
    const timer = window.setTimeout(() => {
      setFailed((old) => [...new Set([...old, current.src])]);
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [current?.src, stopped, ready]);

  function next() {
    if (stopped) return;
    setReady(false);
    setSequence((value) => value + 1);
  }

  if (!current || reducedMotion) return null;
  return (
    <div
      className={`background-video ${ready ? 'is-ready' : ''}`}
      aria-hidden='true'
    >
      <video
        key={`${current.src}-${sequence}`}
        ref={video}
        src={current.src}
        muted
        playsInline
        preload='metadata'
        tabIndex={-1}
        disablePictureInPicture
        onPlaying={() => setReady(true)}
        onWaiting={() => setReady(false)}
        onEnded={next}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= 20) next();
        }}
        onError={() => {
          setReady(false);
          setFailed((old) => [...new Set([...old, current.src])]);
        }}
      />
      <div className='background-video-shade' />
    </div>
  );
}
