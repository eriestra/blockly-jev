import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { confetti } from './confetti';
import {
  almondTheme,
  checkChallenge,
  installJevBlocks,
  jevFromAlmond,
  jevFromProxy,
  jevLessons,
  jevToolboxCategory,
  runJevProgram,
} from '../src/index';

installJevBlocks();

const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    jevToolboxCategory,
    { kind: 'category', name: 'Logic', categorystyle: 'logic_category', contents: [
      { kind: 'block', type: 'controls_if' }, { kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_operation' },
      { kind: 'block', type: 'logic_negate' }, { kind: 'block', type: 'logic_boolean' },
    ]},
    { kind: 'category', name: 'Text', categorystyle: 'text_category', contents: [
      { kind: 'block', type: 'text' }, { kind: 'block', type: 'text_print' }, { kind: 'block', type: 'text_join' },
    ]},
    { kind: 'category', name: 'Loops', categorystyle: 'loop_category', contents: [
      { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } } } },
      { kind: 'block', type: 'controls_whileUntil' }, { kind: 'block', type: 'controls_forEach' },
    ]},
    { kind: 'category', name: 'Math', categorystyle: 'math_category', contents: [
      { kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }, { kind: 'block', type: 'math_round' },
    ]},
    { kind: 'category', name: 'Lists', categorystyle: 'list_category', contents: [
      { kind: 'block', type: 'lists_create_with' }, { kind: 'block', type: 'lists_length' }, { kind: 'block', type: 'lists_getIndex' },
    ]},
    { kind: 'category', name: 'Variables', categorystyle: 'variable_category', custom: 'VARIABLE' },
    { kind: 'category', name: 'Functions', categorystyle: 'procedure_category', custom: 'PROCEDURE' },
  ],
};

const workspace = Blockly.inject('blockly', {
  toolbox,
  theme: almondTheme,
  trashcan: true,
  zoom: { controls: true, wheel: false, startScale: 1 },
  grid: { spacing: 24, length: 2, colour: '#e6e0d5', snap: false },
  move: { scrollbars: true, drag: true, wheel: true },
});

// Print into the output panel instead of window.alert.
javascriptGenerator.forBlock['text_print'] = function (block, gen) {
  const msg = gen.valueToCode(block, 'TEXT', 0) || "''";
  return `print(${msg});\n`;
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const codeEl = $('code');
const outEl = $('output');
const statusEl = $('status');
const railEl = $('rail');
const lessonText = $('lesson-text');
const eyebrowEl = $('lesson-eyebrow');
const callsEl = $('calls');
const runBtn = $<HTMLButtonElement>('run');

function regenerate() {
  codeEl.textContent = javascriptGenerator.workspaceToCode(workspace);
}
workspace.addChangeListener((e) => { if (!e.isUiEvent) regenerate(); });

// ---- progress (which challenges Jev judged complete) ----
const DONE_KEY = 'jev-passed';
function loadDone(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]')); } catch { return new Set(); }
}
const done = loadDone();
let lastOutput: string[] = [];
function saveDone() { try { localStorage.setItem(DONE_KEY, JSON.stringify([...done])); } catch {} }

// ---- lesson rail ----
let currentId = jevLessons[0].id;
const shortTitle = (t: string) => t.replace(/^\d+\.\s*/, '');

for (const lesson of jevLessons) {
  const b = document.createElement('button');
  b.className = 'step';
  b.dataset.id = lesson.id;
  b.type = 'button';
  b.title = lesson.title;
  b.innerHTML = `<span class="dot"></span><span class="label">${shortTitle(lesson.title)}</span>`;
  b.addEventListener('click', () => loadLesson(lesson.id));
  railEl.appendChild(b);
}

function paintRail() {
  const steps = railEl.querySelectorAll<HTMLButtonElement>('.step');
  steps.forEach((step, i) => {
    const id = step.dataset.id!;
    const isDone = done.has(id);
    step.classList.toggle('active', id === currentId);
    step.classList.toggle('done', isDone && id !== currentId);
    const dot = step.querySelector('.dot')!;
    dot.textContent = isDone ? '✓' : String(i + 1);
    step.setAttribute('aria-current', id === currentId ? 'step' : 'false');
  });
  const idx = jevLessons.findIndex((l) => l.id === currentId);
  $<HTMLButtonElement>('prev').disabled = idx <= 0;
  $<HTMLButtonElement>('next').disabled = idx >= jevLessons.length - 1;
}

function setOutput(lines: string[], state: 'idle' | 'running' | 'done' | 'error') {
  outEl.innerHTML = '';
  for (const line of lines) {
    const d = document.createElement('div');
    d.className = 'line';
    d.textContent = line;
    outEl.appendChild(d);
  }
  if (state === 'idle') {
    const d = document.createElement('div'); d.className = 'line idle'; d.textContent = 'Press Run to see what the blocks print.'; outEl.appendChild(d);
  }
  statusEl.hidden = state === 'idle' || state === 'running';
  statusEl.className = 'pill ' + (state === 'error' ? '' : 'green');
  statusEl.textContent = state === 'done' ? 'Done' : state === 'error' ? 'Error' : '';
}

function el(tag: string, className: string, text: string) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.textContent = text;
  return e;
}

function loadWorkspace(ws: Record<string, unknown>, callsLabel: string) {
  Blockly.serialization.workspaces.load(ws as any, workspace);
  workspace.scrollCenter();
  callsEl.textContent = callsLabel;
  setOutput([], 'idle');
  regenerate();
}

function loadLesson(id: string) {
  const lesson = jevLessons.find((l) => l.id === id) ?? jevLessons[0];
  currentId = lesson.id;
  const n = jevLessons.indexOf(lesson) + 1;
  lastOutput = [];
  loadWorkspace(lesson.workspace, `${lesson.calls} Jev call${lesson.calls === 1 ? '' : 's'} per run`);
  eyebrowEl.textContent = `Lesson ${n} of ${jevLessons.length}`;
  lessonText.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = shortTitle(lesson.title);
  const lead = el('p', 'lead', lesson.concept);
  const theory = lesson.theory.map((t) => el('p', '', t));
  const jevP = document.createElement('p'); jevP.innerHTML = '<span class="tag jev">Jev</span>'; jevP.append(lesson.jev);

  // Challenge with progressive hints and a loadable solution.
  const ch = document.createElement('section'); ch.className = 'challenge';
  const chHead = document.createElement('p'); chHead.innerHTML = '<span class="tag try">Challenge</span>'; chHead.append(lesson.challenge.text);
  const hintList = document.createElement('ol'); hintList.className = 'hints';
  const actions = document.createElement('div'); actions.className = 'actions';
  const hintBtn = document.createElement('button'); hintBtn.className = 'btn small'; hintBtn.type = 'button';
  let shown = 0;
  const paintHint = () => { hintBtn.textContent = shown < lesson.challenge.hints.length ? `Hint ${shown + 1} of ${lesson.challenge.hints.length}` : 'No more hints'; hintBtn.disabled = shown >= lesson.challenge.hints.length; };
  hintBtn.addEventListener('click', () => {
    if (shown >= lesson.challenge.hints.length) return;
    hintList.appendChild(el('li', '', lesson.challenge.hints[shown++]));
    paintHint();
  });
  paintHint();
  const solBtn = document.createElement('button'); solBtn.className = 'btn small'; solBtn.type = 'button'; solBtn.textContent = 'Show solution';
  solBtn.addEventListener('click', () => {
    loadWorkspace(lesson.challenge.solution, `${lesson.challenge.calls} Jev call${lesson.challenge.calls === 1 ? '' : 's'} per run`);
    eyebrowEl.textContent = `Lesson ${n} of ${jevLessons.length} · solution`;
    solBtn.textContent = 'Solution loaded';
    solBtn.disabled = true;
  });
  const checkBtn = document.createElement('button'); checkBtn.className = 'btn small primary'; checkBtn.type = 'button'; checkBtn.textContent = 'Check with Jev';
  checkBtn.title = `${lesson.challenge.requirements.length} Jev calls`;
  const verdictEl = document.createElement('p'); verdictEl.className = 'verdict'; verdictEl.hidden = true;
  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true; checkBtn.textContent = 'Checking…';
    verdictEl.hidden = true;
    try {
      const learner = javascriptGenerator.workspaceToCode(workspace);
      const scratch = new Blockly.Workspace();
      Blockly.serialization.workspaces.load(lesson.challenge.solution as any, scratch);
      const reference = javascriptGenerator.workspaceToCode(scratch);
      scratch.dispose();
      const result = await checkChallenge(jev, lesson, learner, lastOutput, reference);
      verdictEl.textContent = result.message;
      verdictEl.title = result.results.map((r) => `${r.passed ? '✓' : '✗'} ${r.requirement} (${r.probability.toFixed(2)})`).join('\n');
      verdictEl.className = 'verdict ' + (result.passed ? 'pass' : 'fail');
      verdictEl.hidden = false;
      if (result.passed) {
        done.add(lesson.id); saveDone(); paintRail();
        const r = verdictEl.getBoundingClientRect();
        confetti({ x: r.left + r.width / 2, y: r.top });
      }
    } catch (err) {
      verdictEl.textContent = 'Could not check: ' + (err instanceof Error ? err.message : String(err));
      verdictEl.className = 'verdict fail';
      verdictEl.hidden = false;
    } finally {
      checkBtn.disabled = false; checkBtn.textContent = 'Check with Jev';
    }
  });
  actions.append(checkBtn, hintBtn, solBtn);
  ch.append(chHead, hintList, actions, verdictEl);

  lessonText.append(h, lead, ...theory, jevP, ch);
  try { localStorage.setItem('jev-lesson', lesson.id); } catch {}
  if (location.hash.slice(1) !== lesson.id) history.replaceState(null, '', `#${lesson.id}`);
  paintRail();
  regenerate();
}

let initial = location.hash.slice(1);
if (!initial) { try { initial = localStorage.getItem('jev-lesson') ?? ''; } catch {} }
loadLesson(initial || jevLessons[0].id);
(window as any).workspace = workspace; // handy in DevTools
(window as any).loadLesson = loadLesson;
(window as any).confetti = confetti;

$('reset').addEventListener('click', () => loadLesson(currentId));
const howDialog = $<HTMLDialogElement>('how-dialog');
$('how').addEventListener('click', () => howDialog.showModal());
$('how-close').addEventListener('click', () => howDialog.close());
howDialog.addEventListener('click', (e) => { if (e.target === howDialog) howDialog.close(); });
$('prev').addEventListener('click', () => { const i = jevLessons.findIndex((l) => l.id === currentId); if (i > 0) loadLesson(jevLessons[i - 1].id); });
$('next').addEventListener('click', () => { const i = jevLessons.findIndex((l) => l.id === currentId); if (i < jevLessons.length - 1) loadLesson(jevLessons[i + 1].id); });
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id && id !== currentId) loadLesson(id);
});

// ---- run ----
const jev = import.meta.env.VITE_JEV_RUNTIME === 'almond' ? jevFromAlmond() : jevFromProxy();

runBtn.addEventListener('click', async () => {
  const lines: string[] = [];
  setOutput(lines, 'running');
  runBtn.disabled = true;
  runBtn.textContent = 'Running…';
  const print = (v: unknown) => { lines.push(String(v)); setOutput(lines, 'running'); };
  try {
    await runJevProgram(javascriptGenerator.workspaceToCode(workspace), { jev, print });
    setOutput(lines, 'done');
    lastOutput = lines;
  } catch (err) {
    lines.push('Error: ' + (err instanceof Error ? err.message : String(err)));
    setOutput(lines, 'error');
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = 'Run';
  }
});
