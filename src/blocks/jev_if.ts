import * as Blockly from 'blockly/core';
import { JEV_COLOUR } from './shared';

/**
 * `jev_if`: an if/else whose condition is a TypeSafe Noul.
 *
 * Jev answers a yes/no question about the connected STATE value and returns
 * the probability that the answer is yes. The DO branch runs when that
 * probability is at least THRESHOLD; otherwise ELSE runs.
 */
export const JEV_IF_TYPE = 'jev_if';

Blockly.defineBlocksWithJsonArray([
  {
    type: JEV_IF_TYPE,
    message0: 'if Jev says yes to %1 about %2',
    args0: [
      { type: 'field_input', name: 'ASK', text: 'Is this a refund request?' },
      { type: 'input_value', name: 'STATE' },
    ],
    message1: 'at least %1 sure %2 describe yes and no',
    args1: [
      { type: 'field_number', name: 'THRESHOLD', value: 0.5, min: 0, max: 1, precision: 0.01 },
      { type: 'field_checkbox', name: 'WITH_CRITERIA', checked: false },
    ],
    message2: 'then %1',
    args2: [{ type: 'input_statement', name: 'DO' }],
    message3: 'else %1',
    args3: [{ type: 'input_statement', name: 'ELSE' }],
    inputsInline: false,
    previousStatement: null,
    nextStatement: null,
    colour: JEV_COLOUR,
    tooltip:
      'Asks Jev a yes/no question (a Noul) about the state. Runs "then" when the ' +
      'probability of yes reaches the threshold, otherwise "else".',
    helpUrl: 'https://docs.typesafe.ai/primitives/noul',
    extensions: ['jev_noul_criteria'],
  },
]);
