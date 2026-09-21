import * as Blockly from 'blockly/core';

/**
 * A Blockly theme on Almond's palette: bone and paper surfaces, ink text,
 * a terracotta accent and violet for Jev. Stock categories get muted,
 * related tones so Jev blocks stay the brightest thing on the canvas.
 */
export const almondPalette = {
  bone: '#f5f2ec',
  paper: '#fbf9f5',
  ink: '#17130f',
  body: '#4a433c',
  muted: '#8a8178',
  rule: '#ddd7cc',
  mark: '#b5622d',
  shell: '#c8873c',
  verified: '#2e7d5b',
  violet: '#7557c7',
} as const;

const block = (colourPrimary: string, colourSecondary: string, colourTertiary: string) => ({
  colourPrimary,
  colourSecondary,
  colourTertiary,
  hat: '',
});

export const almondTheme = Blockly.Theme.defineTheme('almond', {
  name: 'almond',
  base: Blockly.Themes.Classic,
  blockStyles: {
    jev_blocks: block('#7557c7', '#8f77d3', '#5f45a8'),
    logic_blocks: block('#5f6b82', '#7a859b', '#4c576c'),
    loop_blocks: block('#3f8a68', '#5c9f80', '#337356'),
    math_blocks: block('#4f6fa8', '#6d88b9', '#405b8c'),
    text_blocks: block('#3d8a86', '#5c9f9b', '#32736f'),
    list_blocks: block('#c8873c', '#d39f62', '#a8702f'),
    colour_blocks: block('#a55f4d', '#b87a6a', '#8a4d3d'),
    variable_blocks: block('#a55f4d', '#b87a6a', '#8a4d3d'),
    variable_dynamic_blocks: block('#a55f4d', '#b87a6a', '#8a4d3d'),
    procedure_blocks: block('#8a5b8f', '#a077a4', '#724a76'),
  },
  categoryStyles: {
    jev_category: { colour: '#7557c7' },
    logic_category: { colour: '#5f6b82' },
    loop_category: { colour: '#3f8a68' },
    math_category: { colour: '#4f6fa8' },
    text_category: { colour: '#3d8a86' },
    list_category: { colour: '#c8873c' },
    colour_category: { colour: '#a55f4d' },
    variable_category: { colour: '#a55f4d' },
    variable_dynamic_category: { colour: '#a55f4d' },
    procedure_category: { colour: '#8a5b8f' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#fbf9f5',
    toolboxBackgroundColour: '#f5f2ec',
    toolboxForegroundColour: '#17130f',
    flyoutBackgroundColour: '#f5f2ec',
    flyoutForegroundColour: '#4a433c',
    flyoutOpacity: 1,
    scrollbarColour: '#c9c2b6',
    scrollbarOpacity: 0.6,
    insertionMarkerColour: '#b5622d',
    insertionMarkerOpacity: 0.4,
    markerColour: '#b5622d',
    cursorColour: '#b5622d',
    selectedGlowColour: '#b5622d',
    selectedGlowOpacity: 0.35,
  },
  fontStyle: {
    family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    weight: '500',
    size: 12,
  },
  startHats: false,
});
