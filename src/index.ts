import './blocks/shared';
import './blocks/jev_if';
import './blocks/jev_switch';
import './blocks/reporters';
import { installJavascript } from './generators/javascript';

export { JEV_COLOUR } from './blocks/shared';
export type { CountState } from './blocks/shared';
export { JEV_IF_TYPE } from './blocks/jev_if';
export { JEV_SWITCH_TYPE } from './blocks/jev_switch';
export type { JevSwitchState } from './blocks/jev_switch';
export { JEV_NOUL_TYPE, JEV_PROBABILITY_TYPE, JEV_CHOICE_TYPE, JEV_SCORE_TYPE } from './blocks/reporters';
export { installJavascript } from './generators/javascript';
export * from './runtime/index';
export { runJevProgram } from './runtime/run';
export { almondTheme, almondPalette } from './theme';
export { jevLessons } from './lessons';
export { checkChallenge } from './validate';
export type { ChallengeCheck, RequirementResult } from './validate';
export type { JevLesson } from './lessons';
export { jevFromAlmond, ALMOND_MAX_CHOICE_OPTIONS, ALMOND_MAX_SCORE_LEVELS } from './runtime/almond';
export type { AlmondOptions } from './runtime/almond';

const textShadow = { STATE: { shadow: { type: 'text', fields: { TEXT: '' } } } };

/** Toolbox category with every Jev block, ready to splice into a toolbox definition. */
export const jevToolboxCategory = {
  kind: 'category',
  name: 'Jev',
  colour: '#7557c7',
  contents: [
    { kind: 'label', text: 'Reporters: use anywhere a value goes' },
    { kind: 'block', type: 'jev_noul', inputs: textShadow },
    { kind: 'block', type: 'jev_probability', inputs: textShadow },
    { kind: 'block', type: 'jev_choice', extraState: { count: 2 }, inputs: textShadow },
    { kind: 'block', type: 'jev_score', extraState: { count: 3 }, inputs: textShadow },
    { kind: 'label', text: 'Statements' },
    { kind: 'block', type: 'jev_if', inputs: textShadow },
    { kind: 'block', type: 'jev_switch', extraState: { cases: 2, hasDefault: true }, inputs: textShadow },
  ],
};

/** Registers the blocks (import side effect) and the JavaScript generator. */
export function installJevBlocks(): void {
  installJavascript();
}
