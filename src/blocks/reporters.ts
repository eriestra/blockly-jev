import * as Blockly from 'blockly/core';
import { JEV_COLOUR, registerCountMutator } from './shared';

/**
 * Reporter (value) blocks. These output a Boolean, Number or String, so they
 * plug into every stock Blockly block that accepts one: if, while, and/or,
 * compare, arithmetic, list and text blocks.
 */
export const JEV_NOUL_TYPE = 'jev_noul';
export const JEV_PROBABILITY_TYPE = 'jev_probability';
export const JEV_CHOICE_TYPE = 'jev_choice';
export const JEV_SCORE_TYPE = 'jev_score';

Blockly.defineBlocksWithJsonArray([
  {
    type: JEV_NOUL_TYPE,
    message0: 'Jev says yes to %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'Is this a complaint?' },
      { type: 'input_value', name: 'STATE' },
    ],
    message1: 'at least %1 sure %2 describe yes and no',
    args1: [
      { type: 'field_number', name: 'THRESHOLD', value: 0.5, min: 0, max: 1, precision: 0.01 },
      { type: 'field_checkbox', name: 'WITH_CRITERIA', checked: false },
    ],
    inputsInline: false,
    output: 'Boolean',
    colour: JEV_COLOUR,
    tooltip: 'True when the probability of yes reaches the threshold. A Noul.',
    helpUrl: 'https://docs.typesafe.ai/primitives/noul',
    extensions: ['jev_noul_criteria'],
  },
  {
    type: JEV_PROBABILITY_TYPE,
    message0: 'how sure Jev is that %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'the customer is angry' },
      { type: 'input_value', name: 'STATE' },
    ],
    message1: '%1 describe yes and no',
    args1: [{ type: 'field_checkbox', name: 'WITH_CRITERIA', checked: false }],
    inputsInline: false,
    output: 'Number',
    colour: JEV_COLOUR,
    tooltip: 'The probability of yes, from 0 to 1. A Noul.',
    helpUrl: 'https://docs.typesafe.ai/primitives/noul',
    extensions: ['jev_noul_criteria'],
  },
  {
    type: JEV_CHOICE_TYPE,
    message0: 'Jev picks for %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'Which language is this?' },
      { type: 'input_value', name: 'STATE' },
    ],
    inputsInline: false,
    output: 'String',
    colour: JEV_COLOUR,
    tooltip: 'The name of the option Jev picks. A Choice. Add options with +.',
    helpUrl: 'https://docs.typesafe.ai/primitives/choice',
    mutator: 'jev_choice_options',
  },
  {
    type: JEV_SCORE_TYPE,
    message0: 'Jev scores %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'How urgent is this?' },
      { type: 'input_value', name: 'STATE' },
    ],
    inputsInline: false,
    output: 'Number',
    colour: JEV_COLOUR,
    tooltip:
      'Expected score on an ordered scale you describe, from 0 to the last level. A Score. Add levels with +.',
    helpUrl: 'https://docs.typesafe.ai/primitives/score',
    mutator: 'jev_score_levels',
  },
]);

registerCountMutator('jev_choice_options', {
  min: 2,
  initial: 2,
  addRow(block, i) {
    block
      .appendDummyInput(`OPTION${i}`)
      .appendField('option')
      .appendField(new Blockly.FieldTextInput(`option_${i + 1}`), `LABEL${i}`)
      .appendField('meaning')
      .appendField(new Blockly.FieldTextInput(''), `DESC${i}`);
  },
  removeRow(block, i) {
    block.removeInput(`OPTION${i}`);
  },
});

registerCountMutator('jev_score_levels', {
  min: 2,
  initial: 3,
  addRow(block, i) {
    block
      .appendDummyInput(`LEVEL${i}`)
      .appendField(`${i} means`)
      .appendField(new Blockly.FieldTextInput(''), `DESC${i}`);
  },
  removeRow(block, i) {
    block.removeInput(`LEVEL${i}`);
  },
});
