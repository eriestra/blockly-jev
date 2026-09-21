import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { installJevBlocks, jevFromAlmond, jevFromProxy, jevToolboxCategory } from '../src/index';

installJevBlocks();

const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    jevToolboxCategory,
    { kind: 'category', name: 'Logic', categorystyle: 'logic_category', contents: [
      { kind: 'block', type: 'controls_if' }, { kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_boolean' },
    ]},
    { kind: 'category', name: 'Text', categorystyle: 'text_category', contents: [
      { kind: 'block', type: 'text' }, { kind: 'block', type: 'text_print' }, { kind: 'block', type: 'text_join' },
    ]},
    { kind: 'category', name: 'Loops', categorystyle: 'loop_category', contents: [
      { kind: 'block', type: 'controls_whileUntil' }, { kind: 'block', type: 'controls_forEach' },
    ]},
    { kind: 'category', name: 'Math', categorystyle: 'math_category', contents: [
      { kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }, { kind: 'block', type: 'math_round' },
    ]},
    { kind: 'category', name: 'Lists', categorystyle: 'list_category', contents: [
      { kind: 'block', type: 'lists_create_with' }, { kind: 'block', type: 'lists_length' }, { kind: 'block', type: 'lists_getIndex' },
    ]},
    { kind: 'category', name: 'Variables', categorystyle: 'variable_category', custom: 'VARIABLE' },
  ],
};

const workspace = Blockly.inject('blockly', { toolbox, trashcan: true, zoom: { controls: true } });

const example = {
  blocks: { languageVersion: 0, blocks: [
    { type: 'variables_set', x: 20, y: 20, fields: { VAR: { name: 'ticket' } },
      inputs: { VALUE: { block: { type: 'text', fields: { TEXT: 'I was charged twice this month. Please refund the second charge, this is urgent.' } } } },
      next: { block: { type: 'jev_if',
        fields: { ASK: 'Is the customer asking for a refund?', THRESHOLD: 0.5, WITH_CRITERIA: 'FALSE' },
        inputs: {
          STATE: { block: { type: 'variables_get', fields: { VAR: { name: 'ticket' } } } },
          DO: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Refund flow' } } } } } },
          ELSE: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Not a refund' } } } } } },
        },
        next: { block: { type: 'jev_switch',
          extraState: { cases: 3, hasDefault: true },
          fields: { ASK: 'Which team should handle this ticket?', MIN_CONFIDENCE: 0.6,
            LABEL0: 'billing', DESC0: 'Charges, invoices, refunds',
            LABEL1: 'technical', DESC1: 'Bugs, errors, things not working',
            LABEL2: 'sales', DESC2: 'Pricing, plans, upgrades' },
          inputs: {
            STATE: { block: { type: 'variables_get', fields: { VAR: { name: 'ticket' } } } },
            DO0: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Route to billing' } } } } } },
            DO1: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Route to technical' } } } } } },
            DO2: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Route to sales' } } } } } },
            DEFAULT: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Not sure, ask a person' } } } } } },
          },
          next: { block: { type: 'text_print',
            inputs: { TEXT: { block: { type: 'text_join', extraState: { itemCount: 2 }, inputs: {
              ADD0: { block: { type: 'text', fields: { TEXT: 'Urgency 0-2: ' } } },
              ADD1: { block: { type: 'jev_score', extraState: { count: 3 },
                fields: { ASK: 'How urgent is this ticket?', DESC0: 'No time pressure', DESC1: 'Wants it handled soon', DESC2: 'Demands immediate action' },
                inputs: { STATE: { block: { type: 'variables_get', fields: { VAR: { name: 'ticket' } } } } } } },
            } } } },
            next: { block: { type: 'controls_if',
              inputs: {
                IF0: { block: { type: 'jev_noul', fields: { ASK: 'Is the customer angry?', THRESHOLD: 0.7, WITH_CRITERIA: 'FALSE' },
                  inputs: { STATE: { block: { type: 'variables_get', fields: { VAR: { name: 'ticket' } } } } } } },
                DO0: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Stock if + Jev reporter: angry customer' } } } } } },
              },
            } },
          } },
        } },
      } },
    },
  ]},
};

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

function loadExample() {
  Blockly.serialization.workspaces.load(example, workspace);
  regenerate();
}
loadExample();
(window as any).workspace = workspace; // handy in DevTools
document.getElementById('reset')!.addEventListener('click', loadExample);

const onAlmond = import.meta.env.VITE_JEV_RUNTIME === 'almond';
const jev = onAlmond ? jevFromAlmond() : jevFromProxy();
document.getElementById('runtime')!.textContent = onAlmond
  ? 'Runs on Almond: the TypeSafe key stays in Almond protected calls (quota-limited demo).'
  : 'Runs through the local Node proxy on :8787.';
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

document.getElementById('run')!.addEventListener('click', async () => {
  outEl.textContent = '';
  const print = (v: unknown) => { outEl.textContent += String(v) + '\n'; };
  try {
    const fn = new AsyncFunction('jev', 'print', javascriptGenerator.workspaceToCode(workspace));
    await fn(jev, print);
    print('— done —');
  } catch (err) {
    print('Error: ' + (err instanceof Error ? err.message : String(err)));
  }
});
