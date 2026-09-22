import * as Blockly from 'blockly';

export const icon = (name: string) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  fit: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  replay: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5Zm5 5 5 6m0-6-5 6"/>',
  captions: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 10a3 3 0 1 0 0 4m8-4a3 3 0 1 0 0 4"/>',
}[name] ?? '')}</svg>`;

/** Keep Blockly's delete area, history and keyboard handling; replace only its presentation. */
class CompactTrashcan extends Blockly.Trashcan {
  private root: SVGElement | null = null;
  private bounds = new Blockly.utils.Rect(0, 0, 0, 0);
  constructor(private owner: Blockly.WorkspaceSvg) { super(owner); }
  override createDom() {
    const root = super.createDom();
    root.innerHTML = '<title>Drag blocks here to delete. Click to restore deleted blocks.</title><rect class="trash-surface" width="40" height="40" rx="10"/><g class="trash-icon" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(10 10) scale(.8333)"><path d="M5 7h14l-1 14H6Zm4 3v7m6-7v7"/><path class="trash-lid" d="M3 7h18M9 7V3h6v4"/></g>';
    this.root = root;
    return root;
  }
  override position() {
    const m = this.owner.getMetricsManager().getUiMetrics();
    const left = m.absoluteMetrics.left + m.viewMetrics.width - 60;
    const top = m.absoluteMetrics.top + m.viewMetrics.height - 60;
    this.bounds = new Blockly.utils.Rect(top, top + 40, left, left + 40);
    this.root?.setAttribute('transform', `translate(${left},${top})`);
    this.flyout?.position();
  }
  override getBoundingRectangle() { return this.bounds; }
  override getClientRect() {
    if (!this.root) return null;
    const r = this.root.getBoundingClientRect();
    return new Blockly.utils.Rect(r.top - 8, r.bottom + 8, r.left - 8, r.right + 8);
  }
}

export function installCompactTrashcan() {
  Blockly.WorkspaceSvg.newTrashcan = (workspace) => new CompactTrashcan(workspace);
}

export function mountCanvasControls(workspace: Blockly.WorkspaceSvg) {
  const button = (id: string, glyph: string) => {
    const b = document.getElementById(id) as HTMLButtonElement;
    b.innerHTML = icon(glyph);
    return b;
  };
  const toggle = button('toggle-code', 'code');
  const panel = document.getElementById('code-panel')!;
  const close = button('close-code', 'close');
  const setOpen = (open: boolean) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} generated JavaScript`);
    toggle.title = `${open ? 'Hide' : 'Show'} generated JavaScript`;
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => { setOpen(false); toggle.focus(); });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen(false); toggle.focus(); } });
  button('fit-blocks', 'fit').addEventListener('click', () => workspace.zoomToFit());
  button('zoom-in', 'plus').addEventListener('click', () => workspace.zoomCenter(1));
  button('zoom-out', 'minus').addEventListener('click', () => workspace.zoomCenter(-1));
  new ResizeObserver(() => Blockly.svgResize(workspace)).observe(document.getElementById('blockly')!);
}
