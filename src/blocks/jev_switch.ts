import * as Blockly from 'blockly/core';
import { JEV_COLOUR } from './shared';

/**
 * `jev_switch`: a switch whose selector is a TypeSafe Choice.
 *
 * Each case is one Choice option: a label (the criteria key) and an optional
 * description. Jev picks the option that best answers ASK about STATE and the
 * matching branch runs. When an "otherwise" branch exists and the answer's
 * confidence is below MIN_CONFIDENCE, "otherwise" runs instead.
 */
export const JEV_SWITCH_TYPE = 'jev_switch';

export interface JevSwitchState {
  cases: number;
  hasDefault: boolean;
}

interface JevSwitchMixin {
  caseCount_: number;
  hasDefault_: boolean;
  saveExtraState(): JevSwitchState;
  loadExtraState(state: JevSwitchState): void;
  decompose(workspace: Blockly.Workspace): Blockly.Block;
  compose(container: Blockly.Block): void;
  saveConnections(container: Blockly.Block): void;
  updateShape_(): void;
}
type JevSwitchBlock = Blockly.Block & JevSwitchMixin;

Blockly.defineBlocksWithJsonArray([
  {
    type: JEV_SWITCH_TYPE,
    message0: 'switch on what Jev picks for %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'Which team should handle this?' },
      { type: 'input_value', name: 'STATE' },
    ],
    message1: 'use otherwise when less than %1 confident',
    args1: [
      { type: 'field_number', name: 'MIN_CONFIDENCE', value: 0, min: 0, max: 1, precision: 0.01 },
    ],
    inputsInline: false,
    previousStatement: null,
    nextStatement: null,
    colour: JEV_COLOUR,
    tooltip:
      'Asks Jev to pick one option (a Choice) about the state and runs the matching case. ' +
      'Add cases with the gear. "otherwise" runs when the answer is not confident enough.',
    helpUrl: 'https://docs.typesafe.ai/primitives/choice',
    mutator: 'jev_switch_mutator',
  },
  {
    type: 'jev_switch_container',
    message0: 'cases %1 %2',
    args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'STACK' }],
    colour: JEV_COLOUR,
    tooltip: 'Add, remove or reorder cases.',
    enableContextMenu: false,
  },
  {
    type: 'jev_switch_case',
    message0: 'case',
    previousStatement: null,
    nextStatement: null,
    colour: JEV_COLOUR,
    tooltip: 'One option Jev can pick.',
    enableContextMenu: false,
  },
  {
    type: 'jev_switch_default',
    message0: 'otherwise',
    previousStatement: null,
    colour: JEV_COLOUR,
    tooltip: 'Runs when Jev is not confident enough in its pick.',
    enableContextMenu: false,
  },
]);

const JEV_SWITCH_MUTATOR_MIXIN: JevSwitchMixin = {
  caseCount_: 2,
  hasDefault_: false,

  saveExtraState(this: JevSwitchBlock) {
    return { cases: this.caseCount_, hasDefault: this.hasDefault_ };
  },

  loadExtraState(this: JevSwitchBlock, state: JevSwitchState) {
    this.caseCount_ = state.cases ?? 0;
    this.hasDefault_ = !!state.hasDefault;
    this.updateShape_();
  },

  decompose(this: JevSwitchBlock, workspace: Blockly.Workspace) {
    const container = workspace.newBlock('jev_switch_container');
    (container as Blockly.BlockSvg).initSvg?.();
    let connection = container.getInput('STACK')!.connection!;
    for (let i = 0; i < this.caseCount_; i++) {
      const caseBlock = workspace.newBlock('jev_switch_case');
      (caseBlock as Blockly.BlockSvg).initSvg?.();
      connection.connect(caseBlock.previousConnection!);
      connection = caseBlock.nextConnection!;
    }
    if (this.hasDefault_) {
      const def = workspace.newBlock('jev_switch_default');
      (def as Blockly.BlockSvg).initSvg?.();
      connection.connect(def.previousConnection!);
    }
    return container;
  },

  compose(this: JevSwitchBlock, container: Blockly.Block) {
    // Remember the current field values and statement connections so a
    // reorder in the mutator keeps each case's label, description and body.
    const saved: { label: string; desc: string; conn: Blockly.Connection | null }[] = [];
    for (let i = 0; i < this.caseCount_; i++) {
      saved.push({
        label: this.getFieldValue(`LABEL${i}`) ?? '',
        desc: this.getFieldValue(`DESC${i}`) ?? '',
        conn: this.getInput(`DO${i}`)?.connection?.targetConnection ?? null,
      });
    }
    const defaultConn = this.getInput('DEFAULT')?.connection?.targetConnection ?? null;

    let clause = container.getInputTargetBlock('STACK');
    const order: (number | null)[] = [];
    let hasDefault = false;
    while (clause) {
      if (clause.type === 'jev_switch_case') {
        const idx = (clause as any).valueIndex_;
        order.push(typeof idx === 'number' ? idx : null);
      } else if (clause.type === 'jev_switch_default') {
        hasDefault = true;
      }
      clause = clause.nextConnection?.targetBlock() ?? null;
    }

    this.caseCount_ = order.length;
    this.hasDefault_ = hasDefault;
    this.updateShape_();

    order.forEach((from, to) => {
      const src = from === null ? null : saved[from];
      const label = src ? src.label : `option_${to + 1}`;
      this.setFieldValue(label, `LABEL${to}`);
      this.setFieldValue(src ? src.desc : '', `DESC${to}`);
      const target = src?.conn;
      if (target) this.getInput(`DO${to}`)!.connection!.connect(target);
    });
    if (hasDefault && defaultConn) {
      this.getInput('DEFAULT')!.connection!.connect(defaultConn);
    }
  },

  saveConnections(this: JevSwitchBlock, container: Blockly.Block) {
    let clause = container.getInputTargetBlock('STACK');
    let i = 0;
    while (clause) {
      if (clause.type === 'jev_switch_case') {
        (clause as any).valueIndex_ = i < this.caseCount_ ? i : null;
        i++;
      }
      clause = clause.nextConnection?.targetBlock() ?? null;
    }
  },

  updateShape_(this: JevSwitchBlock) {
    // Remove every case/default input, then rebuild to the current counts.
    let i = 0;
    while (this.getInput(`CASE${i}`)) {
      this.removeInput(`CASE${i}`);
      this.removeInput(`DO${i}`);
      i++;
    }
    if (this.getInput('DEFAULT_LABEL')) {
      this.removeInput('DEFAULT_LABEL');
      this.removeInput('DEFAULT');
    }
    for (let c = 0; c < this.caseCount_; c++) {
      this.appendDummyInput(`CASE${c}`)
        .appendField('case')
        .appendField(new Blockly.FieldTextInput(`option_${c + 1}`), `LABEL${c}`)
        .appendField('meaning')
        .appendField(new Blockly.FieldTextInput(''), `DESC${c}`);
      this.appendStatementInput(`DO${c}`);
    }
    if (this.hasDefault_) {
      this.appendDummyInput('DEFAULT_LABEL').appendField('otherwise');
      this.appendStatementInput('DEFAULT');
    }
  },
};

Blockly.Extensions.registerMutator(
  'jev_switch_mutator',
  JEV_SWITCH_MUTATOR_MIXIN,
  function (this: JevSwitchBlock) {
    this.updateShape_();
  },
  ['jev_switch_case', 'jev_switch_default'],
);
