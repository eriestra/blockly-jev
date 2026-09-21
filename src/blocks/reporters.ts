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
    message0: 'Noul %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'Is this a complaint?' },
      { type: 'input_value', name: 'STATE' },
    ],
    message1: 'yes if ≥ %1 %2 criteria',
    args1: [
      { type: 'field_number', name: 'THRESHOLD', value: 0.5, min: 0, max: 1, precision: 0.01 },
      { type: 'field_checkbox', name: 'WITH_CRITERIA', checked: false },
    ],
    inputsInline: false,
    output: 'Boolean',
    colour: JEV_COLOUR,
    tooltip: 'Noul: a yes/no judgment. True when the probability of yes is at least the threshold.',
    helpUrl: 'https://docs.typesafe.ai/primitives/noul',
    extensions: ['jev_noul_criteria'],
  },
  {
    type: JEV_PROBABILITY_TYPE,
    message0: 'Noul probability %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'the customer is angry' },
      { type: 'input_value', name: 'STATE' },
    ],
    message1: '%1 criteria',
    args1: [{ type: 'field_checkbox', name: 'WITH_CRITERIA', checked: false }],
    inputsInline: false,
    output: 'Number',
    colour: JEV_COLOUR,
    tooltip: 'Noul: the probability of yes, from 0 to 1.',
    helpUrl: 'https://docs.typesafe.ai/primitives/noul',
    extensions: ['jev_noul_criteria'],
  },
  {
    type: JEV_CHOICE_TYPE,
    message0: 'Choice %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'Which language is this?' },
      { type: 'input_value', name: 'STATE' },
    ],
    inputsInline: false,
    output: 'String',
    colour: JEV_COLOUR,
    tooltip: 'Choice: picks one of your options and returns its name. Add options with +.',
    helpUrl: 'https://docs.typesafe.ai/primitives/choice',
    mutator: 'jev_choice_options',
  },
  {
    type: JEV_SCORE_TYPE,
    message0: 'Score %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'How urgent is this?' },
      { type: 'input_value', name: 'STATE' },
    ],
    inputsInline: false,
    output: 'Number',
    colour: JEV_COLOUR,
    tooltip:
      'Score: a number on the scale you describe, from 0 to the last level. Add levels with +.',
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
      .appendField(new Blockly.FieldTextInput(`option_${i + 1}`), `LABEL${i}`)
      .appendField(':')
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
      .appendField(`${i} :`)
      .appendField(new Blockly.FieldTextInput(''), `DESC${i}`);
  },
  removeRow(block, i) {
    block.removeInput(`LEVEL${i}`);
  },
});
