import type * as Blockly from 'blockly/core';
import { javascriptGenerator, Order, type JavascriptGenerator } from 'blockly/javascript';
import { JEV_IF_TYPE } from '../blocks/jev_if';
import { JEV_SWITCH_TYPE } from '../blocks/jev_switch';
import { JEV_CHOICE_TYPE, JEV_NOUL_TYPE, JEV_PROBABILITY_TYPE, JEV_SCORE_TYPE } from '../blocks/reporters';

/**
 * Generated code expects a `jev` object in scope that implements
 * `JevRuntime` from `blockly-jev/runtime`, and runs inside an async function
 * because every Jev call is awaited.
 */

function quote(text: string): string {
  return JSON.stringify(text);
}

function stateCode(block: Blockly.Block, generator: JavascriptGenerator): string {
  return generator.valueToCode(block, 'STATE', Order.NONE) || "''";
}

function distinct(generator: JavascriptGenerator, base: string): string {
  const db = (generator as any).nameDB_;
  return db ? db.getDistinctName(base, 'VARIABLE') : base;
}

function noulCriteria(block: Blockly.Block): string {
  if (block.getFieldValue('WITH_CRITERIA') !== 'TRUE') return 'undefined';
  const yes = block.getFieldValue('YES_MEANS') ?? '';
  const no = block.getFieldValue('NO_MEANS') ?? '';
  const parts: string[] = [];
  if (yes) parts.push(`"true": ${quote(yes)}`);
  if (no) parts.push(`"false": ${quote(no)}`);
  return parts.length ? `{${parts.join(', ')}}` : 'undefined';
}

function noulCall(block: Blockly.Block, gen: JavascriptGenerator): string {
  const ask = quote(block.getFieldValue('ASK') ?? '');
  return `await jev.noul(${stateCode(block, gen)}, ${ask}, ${noulCriteria(block)})`;
}

function choiceCriteria(block: Blockly.Block, count: number): { labels: string[]; code: string } {
  const labels: string[] = [];
  const entries: string[] = [];
  for (let i = 0; i < count; i++) {
    const label = block.getFieldValue(`LABEL${i}`) ?? `option_${i + 1}`;
    const desc = block.getFieldValue(`DESC${i}`) ?? '';
    labels.push(label);
    entries.push(`${quote(label)}: ${desc ? quote(desc) : 'null'}`);
  }
  return { labels, code: `{${entries.join(', ')}}` };
}

export function installJavascript(generator: JavascriptGenerator = javascriptGenerator): void {
  // --- statement blocks -----------------------------------------------------

  generator.forBlock[JEV_IF_TYPE] = function (block, gen) {
    const threshold = Number(block.getFieldValue('THRESHOLD') ?? 0.5);
    const doBranch = gen.statementToCode(block, 'DO');
    const elseBranch = gen.statementToCode(block, 'ELSE');
    let code = `if ((${noulCall(block, gen)}).noul >= ${threshold}) {\n${doBranch}}`;
    if (elseBranch) code += ` else {\n${elseBranch}}`;
    return code + '\n';
  };

  generator.forBlock[JEV_SWITCH_TYPE] = function (block, gen) {
    const b = block as Blockly.Block & { caseCount_: number; hasDefault_: boolean };
    const ask = quote(block.getFieldValue('ASK') ?? '');
    const minConfidence = Number(block.getFieldValue('MIN_CONFIDENCE') ?? 0);
    const answer = distinct(gen, 'jevPick');
    const { labels, code: criteria } = choiceCriteria(block, b.caseCount_);

    const cases = labels.map((label, i) => {
      const body = gen.prefixLines(gen.statementToCode(block, `DO${i}`), gen.INDENT);
      return `${gen.INDENT}case ${quote(label)}: {\n${body}${gen.INDENT}${gen.INDENT}break;\n${gen.INDENT}}\n`;
    });
    const switchCode = `switch (${answer}.choice) {\n${cases.join('')}}`;

    let code = `const ${answer} = await jev.choice(${stateCode(block, gen)}, ${ask}, ${criteria});\n`;
    if (b.hasDefault_) {
      const def = gen.statementToCode(block, 'DEFAULT');
      code += `if (${answer}.confidence < ${minConfidence}) {\n${def}} else ${switchCode}\n`;
    } else {
      code += switchCode + '\n';
    }
    return `{\n${gen.prefixLines(code, gen.INDENT)}}\n`;
  };

  // --- reporter blocks ------------------------------------------------------

  generator.forBlock[JEV_NOUL_TYPE] = function (block, gen) {
    const threshold = Number(block.getFieldValue('THRESHOLD') ?? 0.5);
    return [`(${noulCall(block, gen)}).noul >= ${threshold}`, Order.RELATIONAL];
  };

  generator.forBlock[JEV_PROBABILITY_TYPE] = function (block, gen) {
    return [`(${noulCall(block, gen)}).noul`, Order.MEMBER];
  };

  generator.forBlock[JEV_CHOICE_TYPE] = function (block, gen) {
    const b = block as Blockly.Block & { count_: number };
    const ask = quote(block.getFieldValue('ASK') ?? '');
    const { code: criteria } = choiceCriteria(block, b.count_);
    return [`(await jev.choice(${stateCode(block, gen)}, ${ask}, ${criteria})).choice`, Order.MEMBER];
  };

  generator.forBlock[JEV_SCORE_TYPE] = function (block, gen) {
    const b = block as Blockly.Block & { count_: number };
    const ask = quote(block.getFieldValue('ASK') ?? '');
    const levels: string[] = [];
    for (let i = 0; i < b.count_; i++) {
      const desc = block.getFieldValue(`DESC${i}`) ?? '';
      levels.push(desc ? quote(desc) : 'null');
    }
    return [`(await jev.score(${stateCode(block, gen)}, ${ask}, [${levels.join(', ')}])).score`, Order.MEMBER];
  };
}
