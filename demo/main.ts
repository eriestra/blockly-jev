import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { installJevBlocks, jevFromAlmond, jevFromProxy, jevLessons, jevToolboxCategory, runJevProgram } from '../src/index';

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

const workspace = Blockly.inject('blockly', { toolbox, trashcan: true, zoom: { controls: true } });

// Print into the output panel instead of window.alert.
javascriptGenerator.forBlock['text_print'] = function (block, gen) {
  const msg = gen.valueToCode(block, 'TEXT', 0) || "''";
  return `print(${msg});\n`;
};

const codeEl = document.getElementById('code')!;
const outEl = document.getElementById('output')!;

function regenerate() {
  codeEl.textContent = javascriptGenerator.workspaceToCode(workspace);
}
workspace.addChangeListener((e) => { if (!e.isUiEvent) regenerate(); });

const lessonSelect = document.getElementById('lesson') as HTMLSelectElement;
const lessonText = document.getElementById('lesson-text')!;
for (const lesson of jevLessons) {
  const opt = document.createElement('option');
  opt.value = lesson.id;
  opt.textContent = lesson.title;
  lessonSelect.appendChild(opt);
}

function loadLesson(id: string) {
  const lesson = jevLessons.find((l) => l.id === id) ?? jevLessons[0];
  lessonSelect.value = lesson.id;
  Blockly.serialization.workspaces.load(lesson.workspace as any, workspace);
  lessonText.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = lesson.title;
  const p1 = document.createElement('p'); p1.textContent = lesson.concept;
  const p2 = document.createElement('p'); p2.innerHTML = '<b>Jev:</b> '; p2.append(lesson.jev);
  const p3 = document.createElement('p'); p3.innerHTML = '<b>Try it:</b> '; p3.append(lesson.tryIt);
  const p4 = document.createElement('p'); p4.style.color = '#6b6864'; p4.textContent = `One run makes ${lesson.calls} Jev call${lesson.calls === 1 ? '' : 's'}.`;
  lessonText.append(h, p1, p2, p3, p4);
  outEl.textContent = '';
  try { localStorage.setItem('jev-lesson', lesson.id); } catch {}
  history.replaceState(null, '', `#${lesson.id}`);
  regenerate();
}

let initial = location.hash.slice(1);
if (!initial) { try { initial = localStorage.getItem('jev-lesson') ?? ''; } catch {} }
loadLesson(initial || jevLessons[0].id);
(window as any).workspace = workspace; // handy in DevTools
(window as any).loadLesson = loadLesson;
lessonSelect.addEventListener('change', () => loadLesson(lessonSelect.value));
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id && id !== lessonSelect.value) loadLesson(id);
});
document.getElementById('reset')!.addEventListener('click', () => loadLesson(lessonSelect.value));

const jev = import.meta.env.VITE_JEV_RUNTIME === 'almond' ? jevFromAlmond() : jevFromProxy();

document.getElementById('run')!.addEventListener('click', async () => {
  outEl.textContent = '';
  const print = (v: unknown) => { outEl.textContent += String(v) + '\n'; };
  try {
    await runJevProgram(javascriptGenerator.workspaceToCode(workspace), { jev, print });
    print('— done —');
  } catch (err) {
    print('Error: ' + (err instanceof Error ? err.message : String(err)));
  }
});
