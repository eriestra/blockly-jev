/**
 * Ten lessons that teach programming from zero, each using Jev.
 *
 * Every lesson is a Blockly workspace (serialization JSON) plus the text a
 * teacher would say. Load one with
 * `Blockly.serialization.workspaces.load(lesson.workspace, workspace)`.
 *
 * Lessons stay small on purpose: hosted runtimes such as Almond meter Jev
 * calls, and a learner should be able to read every block on one screen.
 */

export interface JevLesson {
  id: string;
  title: string;
  /** The programming idea this lesson introduces. */
  concept: string;
  /** What Jev contributes in this lesson. */
  jev: string;
  /** A small change the learner should try. */
  tryIt: string;
  /** Jev calls one Run makes, so learners can budget quota-limited runtimes. */
  calls: number;
  workspace: Record<string, unknown>;
}

// --- tiny builders for readable workspace JSON -----------------------------

type B = Record<string, any>;
const text = (TEXT: string): B => ({ type: 'text', fields: { TEXT } });
const num = (NUM: number): B => ({ type: 'math_number', fields: { NUM } });
const get = (name: string): B => ({ type: 'variables_get', fields: { VAR: { name } } });
const set = (name: string, value: B): B => ({ type: 'variables_set', fields: { VAR: { name } }, inputs: { VALUE: { block: value } } });
const change = (name: string, by: number): B => ({ type: 'math_change', fields: { VAR: { name } }, inputs: { DELTA: { shadow: num(by) } } });
const print = (value: B): B => ({ type: 'text_print', inputs: { TEXT: { block: value } } });
const join = (...items: B[]): B => ({
  type: 'text_join',
  extraState: { itemCount: items.length },
  inputs: Object.fromEntries(items.map((b, i) => [`ADD${i}`, { block: b }])),
});
const list = (...items: B[]): B => ({
  type: 'lists_create_with',
  extraState: { itemCount: items.length },
  inputs: Object.fromEntries(items.map((b, i) => [`ADD${i}`, { block: b }])),
});
const compare = (OP: 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE', a: B, b: B): B => ({
  type: 'logic_compare', fields: { OP }, inputs: { A: { block: a }, B: { block: b } },
});
const and = (a: B, b: B): B => ({ type: 'logic_operation', fields: { OP: 'AND' }, inputs: { A: { block: a }, B: { block: b } } });
const not = (a: B): B => ({ type: 'logic_negate', inputs: { BOOL: { block: a } } });
const ifElse = (cond: B, doBlock: B, elseBlock?: B): B => ({
  type: 'controls_if',
  ...(elseBlock ? { extraState: { hasElse: true } } : {}),
  inputs: { IF0: { block: cond }, DO0: { block: doBlock }, ...(elseBlock ? { ELSE: { block: elseBlock } } : {}) },
});
const forEach = (name: string, listBlock: B, body: B): B => ({
  type: 'controls_forEach', fields: { VAR: { name } }, inputs: { LIST: { block: listBlock }, DO: { block: body } },
});
const repeat = (times: number, body: B): B => ({
  type: 'controls_repeat_ext', inputs: { TIMES: { shadow: num(times) }, DO: { block: body } },
});
/** Chains statements with `next` so they read top to bottom. */
const seq = (...blocks: B[]): B => {
  for (let i = blocks.length - 2; i >= 0; i--) blocks[i] = { ...blocks[i], next: { block: blocks[i + 1] } };
  return blocks[0];
};

const noul = (ASK: string, state: B, THRESHOLD = 0.5): B => ({
  type: 'jev_noul', fields: { ASK, THRESHOLD, WITH_CRITERIA: 'FALSE' }, inputs: { STATE: { block: state } },
});
const probability = (ASK: string, state: B): B => ({
  type: 'jev_probability', fields: { ASK, WITH_CRITERIA: 'FALSE' }, inputs: { STATE: { block: state } },
});
const choice = (ASK: string, state: B, options: [string, string][]): B => ({
  type: 'jev_choice',
  extraState: { count: options.length },
  fields: { ASK, ...Object.fromEntries(options.flatMap(([l, d], i) => [[`LABEL${i}`, l], [`DESC${i}`, d]])) },
  inputs: { STATE: { block: state } },
});
const score = (ASK: string, state: B, levels: string[]): B => ({
  type: 'jev_score',
  extraState: { count: levels.length },
  fields: { ASK, ...Object.fromEntries(levels.map((d, i) => [`DESC${i}`, d])) },
  inputs: { STATE: { block: state } },
});
const jevIf = (ASK: string, state: B, doBlock: B, elseBlock: B, THRESHOLD = 0.5): B => ({
  type: 'jev_if',
  fields: { ASK, THRESHOLD, WITH_CRITERIA: 'FALSE' },
  inputs: { STATE: { block: state }, DO: { block: doBlock }, ELSE: { block: elseBlock } },
});
const jevSwitch = (ASK: string, state: B, cases: [string, string, B][], otherwise: B, MIN_CONFIDENCE = 0.6): B => ({
  type: 'jev_switch',
  extraState: { cases: cases.length, hasDefault: true },
  fields: { ASK, MIN_CONFIDENCE, ...Object.fromEntries(cases.flatMap(([l, d], i) => [[`LABEL${i}`, l], [`DESC${i}`, d]])) },
  inputs: {
    STATE: { block: state },
    ...Object.fromEntries(cases.map(([, , body], i) => [`DO${i}`, { block: body }])),
    DEFAULT: { block: otherwise },
  },
});
const defReturn = (name: string, params: string[], body: B | null, ret: B): B => ({
  type: 'procedures_defreturn',
  fields: { NAME: name },
  extraState: { params: params.map((p) => ({ name: p, id: `param_${p}` })) },
  inputs: { ...(body ? { STACK: { block: body } } : {}), RETURN: { block: ret } },
});
const callReturn = (name: string, params: string[], args: B[]): B => ({
  type: 'procedures_callreturn',
  extraState: { name, params },
  inputs: Object.fromEntries(args.map((a, i) => [`ARG${i}`, { block: a }])),
});

const ws = (root: B, extra: Record<string, unknown> = {}, more: B[] = []): Record<string, unknown> => ({
  ...extra,
  blocks: { languageVersion: 0, blocks: [{ x: 20, y: 20, ...root }, ...more] },
});

// --- the lessons -----------------------------------------------------------

export const jevLessons: JevLesson[] = [
  {
    id: 'hello',
    title: '1. Hello, world',
    concept:
      'A program is a list of instructions the computer follows top to bottom. "print" shows a value. Values can be text, numbers, or true/false.',
    jev: 'The second print shows a value that comes from Jev: true or false, for a yes/no question about some text. That is all AI is here: another value your program can use.',
    tryIt: 'Change the question to "Is this text about food?" and run again.',
    calls: 1,
    workspace: ws(
      seq(
        print(text('Hello, world!')),
        print(noul('Is this text a greeting?', text('Hello, world!'))),
      ),
    ),
  },
  {
    id: 'variables',
    title: '2. Variables',
    concept:
      'A variable is a name for a value, so you can write the value once and use it many times. "set message to" stores it; "message" reads it back.',
    jev: '"how sure Jev is" returns a number between 0 and 1: the probability that the answer is yes. Numbers like this can be stored, compared, and printed like any other.',
    tryIt: 'Change the message to something sad and watch the number drop.',
    calls: 1,
    workspace: ws(
      seq(
        set('message', text('What a wonderful morning, the sun is out!')),
        print(get('message')),
        print(join(text('Happiness: '), probability('the writer sounds happy', get('message')))),
      ),
    ),
  },
  {
    id: 'if-else',
    title: '3. If and else',
    concept:
      'Programs make decisions. "if ... then ... else" runs one branch when a condition is true and the other when it is false.',
    jev: 'The condition is a Jev yes/no judgment. "at least 0.5 sure" is the threshold: yes wins when the probability is 0.5 or more.',
    tryIt: 'Set the threshold to 0.9 and try a message that is only half a question, like "Maybe tomorrow?".',
    calls: 1,
    workspace: ws(
      seq(
        set('message', text('Could you send me the invoice again?')),
        jevIf(
          'Is this message a question?',
          get('message'),
          print(text('That is a question. Someone should answer it.')),
          print(text('That is a statement. No answer needed.')),
        ),
      ),
    ),
  },
  {
    id: 'numbers',
    title: '4. Numbers and comparisons',
    concept:
      'Numbers can be compared with <, =, >. A comparison gives true or false, so it can drive an ordinary "if" block.',
    jev: '"Jev scores" places text on a scale you describe: 0 means rude, 1 neutral, 2 polite. The result is a number, so you compare it like any other.',
    tryIt: 'Add a fourth level, "3 means warm and grateful", and raise the comparison to 2.5.',
    calls: 1,
    workspace: ws(
      seq(
        set('message', text('Thanks so much for your help yesterday, it made my day.')),
        set('politeness', score('How polite is this message?', get('message'), ['Rude or hostile', 'Neutral, just business', 'Polite and friendly'])),
        print(join(text('Politeness 0-2: '), get('politeness'))),
        ifElse(
          compare('GTE', get('politeness'), num(1.5)),
          print(text('Reply warmly.')),
          print(text('Reply carefully.')),
        ),
      ),
    ),
  },
  {
    id: 'switch',
    title: '5. Choosing between many options',
    concept:
      'When there are more than two possibilities, a switch picks one branch out of many. "otherwise" is the safety net when nothing fits well.',
    jev: 'Jev picks one option from the labels you write. Each option has a meaning so Jev knows what it covers. "otherwise" runs when Jev is not confident enough.',
    tryIt: 'Add a case "account" meaning "Passwords, sign-in, profile" and write a ticket that matches it.',
    calls: 1,
    workspace: ws(
      seq(
        set('ticket', text('I was charged twice this month. Please refund the second charge.')),
        jevSwitch(
          'Which team should handle this ticket?',
          get('ticket'),
          [
            ['billing', 'Charges, invoices, refunds', print(text('Route to billing'))],
            ['technical', 'Bugs, errors, things not working', print(text('Route to technical'))],
            ['sales', 'Pricing, plans, upgrades', print(text('Route to sales'))],
          ],
          print(text('Not sure. Ask a person.')),
        ),
      ),
    ),
  },
  {
    id: 'lists-loops',
    title: '6. Lists and loops',
    concept:
      'A list holds many values in order. "for each item in list" runs the same blocks once per item, with "item" holding the current value.',
    jev: 'Jev runs once per item. Here it names the language of each message, so the loop translates a chore into three quick judgments.',
    tryIt: 'Add a fourth message in Portuguese and a fourth option "pt".',
    calls: 3,
    workspace: ws(
      forEach(
        'message',
        list(text('Where is my order?'), text('¿Dónde está mi pedido?'), text('Où est ma commande ?')),
        print(join(
          get('message'),
          text('  →  '),
          choice('Which language is this message written in?', get('message'), [['en', 'English'], ['es', 'Spanish'], ['fr', 'French']]),
        )),
      ),
    ),
  },
  {
    id: 'counting',
    title: '7. Counting with a loop',
    concept:
      'A counter is a variable that starts at 0 and grows inside a loop. After the loop it holds a total. This pattern is everywhere in programming.',
    jev: 'The loop asks Jev whether each review is positive and adds 1 when it is. Three small judgments become one useful number.',
    tryIt: 'Count negative reviews too, with a second counter and "not" around the Jev block.',
    calls: 3,
    workspace: ws(
      seq(
        set('positive', num(0)),
        forEach(
          'review',
          list(
            text('Fast delivery and the shoes fit perfectly.'),
            text('Box arrived crushed and one shoe was missing.'),
            text('Decent quality for the price, would buy again.'),
          ),
          ifElse(noul('Is this review positive?', get('review')), change('positive', 1)),
        ),
        print(join(text('Positive reviews: '), get('positive'), text(' of 3'))),
      ),
    ),
  },
  {
    id: 'logic',
    title: '8. Combining conditions',
    concept:
      '"and", "or" and "not" combine true/false values. "A and B" is true only when both are. This lets one "if" express a rule with several parts.',
    jev: 'Two separate Jev judgments, urgent and angry, are combined with "and". Keeping judgments separate keeps each one simple and lets you reuse them.',
    tryIt: 'Change "and" to "or", then write a message that is angry but not urgent.',
    calls: 2,
    workspace: ws(
      seq(
        set('message', text('This is the third time I write. Fix my account TODAY or I cancel.')),
        ifElse(
          and(
            noul('Does the writer need something done urgently?', get('message')),
            noul('Is the writer angry?', get('message')),
          ),
          print(text('Escalate to a senior agent now.')),
          print(text('Normal queue.')),
        ),
        ifElse(
          not(noul('Does the message mention money or payments?', get('message'))),
          print(text('Not about billing.')),
          print(text('Mentions billing.')),
        ),
      ),
    ),
  },
  {
    id: 'functions',
    title: '9. Functions',
    concept:
      'A function wraps blocks under a name so you can call them again with different inputs. "text" is a parameter: a variable that receives whatever you pass in.',
    jev: 'The function "mood of" asks Jev once and returns the label. Calling it twice reuses the same judgment on two messages without copying blocks.',
    tryIt: 'Add a third call with your own sentence, then add a fourth mood.',
    calls: 2,
    workspace: ws(
      seq(
        print(join(text('First: '), callReturn('mood of', ['text'], [text('I finally got the job, we are celebrating tonight!')]))),
        print(join(text('Second: '), callReturn('mood of', ['text'], [text('The flight got cancelled and nobody will tell us why.')]))),
      ),
      { variables: [{ name: 'text', id: 'param_text' }] },
      [
        {
          x: 20,
          y: 180,
          ...defReturn(
            'mood of',
            ['text'],
            null,
            choice('What is the mood of this text?', get('text'), [
              ['joyful', 'Happy, excited, celebrating'],
              ['frustrated', 'Annoyed, blocked, complaining'],
              ['calm', 'Neutral or matter of fact'],
            ]),
          ),
        },
      ],
    ),
  },
  {
    id: 'assistant',
    title: '10. A small assistant',
    concept:
      'Real programs combine everything: a list, a loop, variables, functions, decisions and numbers. Read this one top to bottom and name each idea from lessons 1 to 9.',
    jev: 'For every message the assistant asks Jev for a category and an urgency score, then code decides what to do. Jev supplies judgment; the rules stay in your blocks.',
    tryIt: 'Add a "priority" counter that only grows when urgency is above 1.5 and the category is billing.',
    calls: 6,
    workspace: ws(
      seq(
        set('urgent', num(0)),
        forEach(
          'message',
          list(
            text('The app crashes every time I open the camera.'),
            text('Charged twice again. Refund me today, this is unacceptable.'),
            text('Do you offer a discount for annual plans?'),
          ),
          seq(
            set('category', callReturn('category of', ['text'], [get('message')])),
            set('urgency', score('How urgent is this message?', get('message'), ['No time pressure', 'Should be handled soon', 'Needs action right now'])),
            print(join(get('category'), text(' / urgency '), get('urgency'), text(': '), get('message'))),
            ifElse(compare('GT', get('urgency'), num(1.5)), change('urgent', 1)),
          ),
        ),
        print(join(text('Urgent messages: '), get('urgent'))),
      ),
      { variables: [{ name: 'text', id: 'param_text' }] },
      [
        {
          x: 20,
          y: 420,
          ...defReturn(
            'category of',
            ['text'],
            null,
            choice('What kind of request is this?', get('text'), [
              ['billing', 'Charges, invoices, refunds'],
              ['technical', 'Bugs, errors, things not working'],
              ['sales', 'Pricing, plans, discounts'],
            ]),
          ),
        },
      ],
    ),
  },
];
