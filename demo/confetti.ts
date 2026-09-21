/**
 * Confetti via canvas-confetti (https://confetti.js.org), in Almond's palette.
 *
 * `useWorker` is a global option, not a per-call one, so a dedicated instance
 * is created with the worker off: Almond's Content Security Policy blocks
 * blob: workers, and with the default instance the worker silently fails and
 * nothing is drawn.
 */
import canvasConfetti from 'canvas-confetti';

const COLOURS = ['#b5622d', '#c8873c', '#2e7d5b', '#7557c7', '#e9c46a', '#fbf9f5'];

let cannon: canvasConfetti.CreateTypes | null = null;
function getCannon(): canvasConfetti.CreateTypes {
  if (!cannon) cannon = canvasConfetti.create(undefined as unknown as HTMLCanvasElement, { useWorker: false, resize: true });
  return cannon;
}

export function confetti(origin?: { x: number; y: number }): void {
  if (typeof window === 'undefined') return;
  const o = origin
    ? { x: origin.x / window.innerWidth, y: origin.y / window.innerHeight }
    : { x: 0.5, y: 0.4 };
  const base: canvasConfetti.Options = { origin: o, colors: COLOURS, zIndex: 9999 };
  const fire = getCannon();
  const shoot = (ratio: number, opts: canvasConfetti.Options) =>
    fire({ ...base, ...opts, particleCount: Math.floor(220 * ratio) });
  // "Realistic look" recipe from the canvas-confetti docs.
  shoot(0.25, { spread: 26, startVelocity: 55 });
  shoot(0.2, { spread: 60 });
  shoot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  shoot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  shoot(0.1, { spread: 120, startVelocity: 45 });
}
