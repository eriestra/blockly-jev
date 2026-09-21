import * as Blockly from 'blockly/core';

/** Almond violet; blocks accept a hex colour anywhere a hue is accepted. */
export const JEV_COLOUR = '#7557c7';

/**
 * Extension shared by Noul-based blocks: a "describe yes and no" checkbox
 * that adds or removes an optional criteria row (YES_MEANS / NO_MEANS).
 */
Blockly.Extensions.register('jev_noul_criteria', function (this: Blockly.Block) {
  const block = this;
  const update = (show: boolean) => {
    const existing = block.getInput('CRITERIA');
    if (show && !existing) {
      block
        .appendDummyInput('CRITERIA')
        .appendField('yes :')
        .appendField(new Blockly.FieldTextInput(''), 'YES_MEANS')
        .appendField('no :')
        .appendField(new Blockly.FieldTextInput(''), 'NO_MEANS');
      if (block.getInput('DO')) block.moveInputBefore('CRITERIA', 'DO');
    } else if (!show && existing) {
      block.removeInput('CRITERIA');
    }
  };
  const field = block.getField('WITH_CRITERIA');
  field?.setValidator((value: string) => {
    update(value === 'TRUE');
    return value;
  });
  update(field?.getValue() === 'TRUE');
});

const PLUS =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff" fill-opacity=".25"/><path d="M12 6v12M6 12h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  );
const MINUS =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff" fill-opacity=".25"/><path d="M6 12h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  );

export interface CountState {
  count: number;
}

export interface CountMixin {
  count_: number;
  saveExtraState(): CountState;
  loadExtraState(state: CountState): void;
  updateShape_(): void;
  setCount_(next: number): void;
}
export type CountBlock = Blockly.Block & CountMixin;

export interface CountMutatorOptions {
  /** Smallest allowed count. */
  min: number;
  /** Count for a freshly created block. */
  initial: number;
  /** Adds the inputs for row `i`. */
  addRow(block: Blockly.Block, i: number): void;
  /** Removes the inputs for row `i`. */
  removeRow(block: Blockly.Block, i: number): void;
}

/**
 * Registers a mutator that grows or shrinks a block by whole rows using
 * plus/minus buttons on the block itself, without a mutator bubble.
 */
export function registerCountMutator(name: string, options: CountMutatorOptions): void {
  const mixin: CountMixin = {
    count_: options.initial,

    saveExtraState(this: CountBlock) {
      return { count: this.count_ };
    },

    loadExtraState(this: CountBlock, state: CountState) {
      this.count_ = Math.max(options.min, state?.count ?? options.initial);
      this.updateShape_();
    },

    setCount_(this: CountBlock, next: number) {
      next = Math.max(options.min, next);
      if (next === this.count_) return;
      const before = JSON.stringify(this.saveExtraState());
      Blockly.Events.setGroup(true);
      this.count_ = next;
      this.updateShape_();
      Blockly.Events.fire(
        new Blockly.Events.BlockChange(this, 'mutation', null, before, JSON.stringify(this.saveExtraState())),
      );
      Blockly.Events.setGroup(false);
    },

    updateShape_(this: CountBlock) {
      // Rows are tracked by a marker input named ROW<i>.
      let existing = 0;
      while (this.getInput(`ROW${existing}`)) existing++;
      for (let i = existing - 1; i >= this.count_; i--) {
        options.removeRow(this, i);
        this.removeInput(`ROW${i}`);
      }
      for (let i = existing; i < this.count_; i++) {
        this.appendDummyInput(`ROW${i}`).setVisible(false);
        options.addRow(this, i);
      }
      const minus = this.getField('MINUS');
      if (minus) minus.setVisible(this.count_ > options.min);
    },
  };

  Blockly.Extensions.registerMutator(name, mixin, function (this: CountBlock) {
    const block = this;
    const controls = block.getInput('CONTROLS') ?? block.appendDummyInput('CONTROLS');
    controls
      .appendField(new Blockly.FieldImage(PLUS, 16, 16, 'add', () => block.setCount_(block.count_ + 1)), 'PLUS')
      .appendField(new Blockly.FieldImage(MINUS, 16, 16, 'remove', () => block.setCount_(block.count_ - 1)), 'MINUS');
    block.updateShape_();
  });
}
