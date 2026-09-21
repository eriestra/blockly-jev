/**
 * Confetti via canvas-confetti (https://confetti.js.org), in Almond's palette.
 * The worker is disabled because Almond's Content Security Policy does not
 * allow blob: workers; skipped when the visitor prefers reduced motion.
 */
import canvasConfetti from 'canvas-confetti';

const COLOURS = ['#b5622d', '#c8873c', '#2e7d5b', '#7557c7', '#e9c46a', '#fbf9f5'];

export function confetti(origin?: { x: number; y: number }): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const o = origin
    ? { x: origin.x / window.innerWidth, y: origin.y / window.innerHeight }
    : { x: 0.5, y: 0.4 };
  const base = { origin: o, colors: COLOURS, useWorker: false, disableForReducedMotion: true, zIndex: 9999 };

  // "Realistic look" recipe from the canvas-confetti docs.
  const fire = (ratio: number, opts: canvasConfetti.Options) =>
    canvasConfetti({ ...base, ...opts, particleCount: Math.floor(220 * ratio) });
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}
