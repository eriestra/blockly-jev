/**
 * A short confetti burst on a full-screen canvas. No dependencies, Almond
 * palette, skipped when the visitor prefers reduced motion.
 */
const COLOURS = ['#b5622d', '#c8873c', '#2e7d5b', '#7557c7', '#e9c46a', '#fbf9f5'];

interface Piece {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; rot: number; vr: number;
  colour: string; shape: 'rect' | 'circle';
}

export function confetti(origin?: { x: number; y: number }): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = (canvas.width = Math.floor(innerWidth * dpr));
  const H = (canvas.height = Math.floor(innerHeight * dpr));
  const ox = (origin?.x ?? innerWidth / 2) * dpr;
  const oy = (origin?.y ?? innerHeight * 0.35) * dpr;

  const pieces: Piece[] = [];
  const COUNT = 160;
  for (let i = 0; i < COUNT; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = (9 + Math.random() * 14) * dpr;
    pieces.push({
      x: ox, y: oy,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      w: (6 + Math.random() * 6) * dpr, h: (4 + Math.random() * 8) * dpr,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.3,
      colour: COLOURS[i % COLOURS.length],
      shape: Math.random() < 0.25 ? 'circle' : 'rect',
    });
  }

  const gravity = 0.35 * dpr;
  const drag = 0.985;
  const start = performance.now();
  const DURATION = 2600;

  function frame(now: number) {
    const t = now - start;
    ctx!.clearRect(0, 0, W, H);
    const fade = t > DURATION - 600 ? Math.max(0, (DURATION - t) / 600) : 1;
    ctx!.globalAlpha = fade;
    for (const p of pieces) {
      p.vx *= drag; p.vy = p.vy * drag + gravity;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.colour;
      if (p.shape === 'circle') {
        ctx!.beginPath(); ctx!.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx!.fill();
      } else {
        // Squash the width with a cosine so pieces look like they tumble.
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w * Math.abs(Math.cos(p.rot * 1.7)) + 1, p.h);
      }
      ctx!.restore();
    }
    if (t < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
