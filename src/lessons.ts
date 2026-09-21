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

export interface JevChallenge {
  /** What the learner must build, in one or two sentences. */
  text: string;
  /** Progressive hints, from a nudge to almost the answer. */
  hints: string[];
  /** Jev calls one run of the solution makes. */
  calls: number;
  /** A workspace that solves the challenge. */
  solution: Record<string, unknown>;
}

export interface JevLesson {
  id: string;
  title: string;
  /** The programming idea this lesson introduces, in one sentence. */
  concept: string;
  /** Theory: short paragraphs a teacher would say before showing the example. */
  theory: string[];
  /** What Jev contributes in this lesson. */
  jev: string;
  /** Jev calls one Run of the worked example makes, so learners can budget quota-limited runtimes. */
  calls: number;
  /** The worked example that opens the lesson. */
  workspace: Record<string, unknown>;
  challenge: JevChallenge;
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
const or = (a: B, b: B): B => ({ type: 'logic_operation', fields: { OP: 'OR' }, inputs: { A: { block: a }, B: { block: b } } });
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
    theory: [
      "A program is a recipe: a list of steps the computer follows in order, top to bottom, without skipping. In Blockly each step is a block, and blocks that snap together run one after the other.",
      "\"print\" is your window into the program: whatever value you give it appears in the output. A value can be text (in quotes), a number, or a truth value: true or false.",
      "The second print does not hold a fixed value. It holds a question. When the program runs, the Noul block asks Jev the question about the text and hands back true or false. From the program's point of view it is just another value.",
    ],
    jev: 'A Noul is a yes/no judgment. The second print shows its value, true or false, for a question about some text. That is all AI is here: another value your program can use.',
    calls: 1,
    workspace: ws(
      seq(
        print(text('Hello, world!')),
        print(noul('Is this text a greeting?', text('Hello, world!'))),
      ),
    ),
    challenge: {
      text: "Print a greeting in another language, then print two Nouls about it: whether it is a greeting, and whether it is written in Spanish.",
      hints: [
        "You need three print blocks stacked in order.",
        "Duplicate the Noul block (right-click, Duplicate) and change only its question.",
        "The questions can be \"Is this text a greeting?\" and \"Is this text written in Spanish?\", both about the same text.",
      ],
      calls: 2,
      solution: ws(
        seq(
          print(text('¡Hola, mundo!')),
          print(noul('Is this text a greeting?', text('¡Hola, mundo!'))),
          print(noul('Is this text written in Spanish?', text('¡Hola, mundo!'))),
        ),
      ),
    },
  },
  {
    id: 'variables',
    title: '2. Variables',
    concept:
      'A variable is a name for a value, so you can write the value once and use it many times. "set message to" stores it; "message" reads it back.',
    theory: [
      "Typing the same text three times is error-prone. A variable gives a value a name, so you write it once and refer to it by name everywhere else. Change the value in one place and every use follows.",
      "\"set message to\" stores a value under the name message. The round \"message\" block reads it back. A variable can hold any kind of value: text, a number, a truth value.",
      "\"Noul probability\" returns a number between 0 and 1 instead of true/false: how likely it is that the answer is yes. 0.95 is a confident yes, 0.05 a confident no, and 0.5 means the model finds yes and no equally likely. It is a number, so you can store it, add it, and compare it.",
    ],
    jev: '"Noul probability" returns a number between 0 and 1: the probability that the answer is yes. Numbers like this can be stored, compared, and printed like any other.',
    calls: 1,
    workspace: ws(
      seq(
        set('message', text('What a wonderful morning, the sun is out!')),
        print(get('message')),
        print(join(text('Happiness: '), probability('the writer sounds happy', get('message')))),
      ),
    ),
    challenge: {
      text: "Store a message in a variable, then print two probabilities about it: how likely the writer sounds happy and how likely they sound worried.",
      hints: [
        "Reuse the \"message\" variable block for both Nouls instead of retyping the text.",
        "Duplicate the print block with the join inside it and change the label and the question.",
        "The second question can be \"the writer sounds worried\".",
      ],
      calls: 2,
      solution: ws(
        seq(
          set('message', text('I hope the results come back fine, the doctor said she would call today.')),
          print(join(text('Happy: '), probability('the writer sounds happy', get('message')))),
          print(join(text('Worried: '), probability('the writer sounds worried', get('message')))),
        ),
      ),
    },
  },
  {
    id: 'if-else',
    title: '3. If and else',
    concept:
      'Programs make decisions. "if ... then ... else" runs one branch when a condition is true and the other when it is false.',
    theory: [
      "So far every block ran. Programs get interesting when they choose. \"if ... then ... else\" looks at a condition, a value that is true or false, and runs only one of its two branches.",
      "Any true/false value can be the condition: a comparison, a Noul, or a combination of them. The branch that does not run is simply skipped.",
      "\"if Noul\" folds the question and the decision into one block. \"yes if ≥ 0.5\" is the threshold: yes wins when the probability of yes is at least that number. Raise it when a wrong yes is costly, lower it when a missed yes is costly.",
    ],
    jev: 'The condition is a Noul. "yes if ≥ 0.5" is the threshold: yes wins when the probability is 0.5 or more.',
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
    challenge: {
      text: "Decide whether a message is a complaint. If it is, print \"Send to support\"; otherwise print \"Send to marketing\". Only treat it as a complaint when Jev is at least 0.7 sure.",
      hints: [
        "Start from the example and change the question to \"Is this message a complaint?\".",
        "The threshold field is the number after \"yes if ≥\". Set it to 0.7.",
        "Change the two print texts, then try a message that praises the product to see the else branch run.",
      ],
      calls: 1,
      solution: ws(
        seq(
          set('message', text('The app deleted my notes twice this week. I am done recommending it.')),
          jevIf(
            'Is this message a complaint?',
            get('message'),
            print(text('Send to support')),
            print(text('Send to marketing')),
            0.7,
          ),
        ),
      ),
    },
  },
  {
    id: 'numbers',
    title: '4. Numbers and comparisons',
    concept:
      'Numbers can be compared with <, =, >. A comparison gives true or false, so it can drive an ordinary "if" block.',
    theory: [
      "Numbers are values you can calculate with and compare. The compare block takes two values and an operator such as <, =, or ≥, and produces true or false, which any \"if\" can use.",
      "A Score turns text into a number on a scale you define. You describe each level: 0 means this, 1 means that, 2 means the other. Jev returns the expected position on that scale, so 1.6 means \"between level 1 and 2, closer to 2\".",
      "Because the result is a number, thresholds live in your code, not in the model. Change the comparison and the program behaves differently without asking Jev anything new.",
    ],
    jev: 'A Score places text on a scale you describe: 0 is rude, 1 neutral, 2 polite. The result is a number, so you compare it like any other.',
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
    challenge: {
      text: "Score a message's urgency on three levels (no rush, soon, right now). Print the score, then print \"Handle today\" when it is above 1, otherwise \"Can wait\".",
      hints: [
        "Change the Score question and its three level descriptions; keep the variable, but rename it to urgency.",
        "In the compare block choose > and put 1 in the number.",
        "Level descriptions should describe situations, for example \"Needs action right now\", not just the word \"high\".",
      ],
      calls: 1,
      solution: ws(
        seq(
          set('message', text('Our site is down and customers are calling. Please look at it now.')),
          set('urgency', score('How urgent is this message?', get('message'), ['No time pressure', 'Should be handled soon', 'Needs action right now'])),
          print(join(text('Urgency 0-2: '), get('urgency'))),
          ifElse(
            compare('GT', get('urgency'), num(1)),
            print(text('Handle today')),
            print(text('Can wait')),
          ),
        ),
      ),
    },
  },
  {
    id: 'switch',
    title: '5. Choosing between many options',
    concept:
      'When there are more than two possibilities, a switch picks one branch out of many. "otherwise" is the safety net when nothing fits well.',
    theory: [
      "Two branches are often not enough. A switch lists several cases and runs exactly one of them, the one that matches. It reads better than a pile of nested ifs.",
      "\"switch Choice\" asks Jev to pick one of your cases. Each case has a label, which becomes the answer, and a description that tells Jev what the label covers. Good descriptions matter more than clever labels.",
      "Jev also reports confidence: how concentrated its pick was. The \"otherwise\" branch runs when confidence is below the limit you set, so unclear inputs go to a safe default instead of a wrong case.",
    ],
    jev: 'A Choice picks one option from the labels you write. Each option has a description so Jev knows what it covers. "otherwise" runs when confidence is too low.',
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
    challenge: {
      text: "Build a language router: when a message is in Spanish reply \"Hola, ¿en qué puedo ayudar?\", in English \"Hi, how can I help?\", in French \"Bonjour, comment puis-je aider ?\". Otherwise print \"Sorry, which language is this?\".",
      hints: [
        "Keep the switch block. Change the question to \"Which language is this message written in?\".",
        "Rename the three cases to es, en and fr, with descriptions Spanish, English and French.",
        "Test the otherwise branch with a message in a fourth language, such as German.",
      ],
      calls: 1,
      solution: ws(
        seq(
          set('message', text('¿Podrían ayudarme con mi factura de este mes?')),
          jevSwitch(
            'Which language is this message written in?',
            get('message'),
            [
              ['es', 'Spanish', print(text('Hola, ¿en qué puedo ayudar?'))],
              ['en', 'English', print(text('Hi, how can I help?'))],
              ['fr', 'French', print(text('Bonjour, comment puis-je aider ?'))],
            ],
            print(text('Sorry, which language is this?')),
          ),
        ),
      ),
    },
  },
  {
    id: 'lists-loops',
    title: '6. Lists and loops',
    concept:
      'A list holds many values in order. "for each item in list" runs the same blocks once per item, with "item" holding the current value.',
    theory: [
      "A list holds several values in order: three messages, ten scores, a hundred names. You build one with \"create list with\" and it behaves as a single value you can store and pass around.",
      "A loop repeats blocks. \"for each item in list\" runs its body once per element and, each time, puts the current element into the loop variable. Three items, three runs, no copy-paste.",
      "Put a Jev block inside the loop and it runs once per item. That is how a judgment about one message becomes a judgment about every message.",
    ],
    jev: 'The Choice runs once per item. Here it names the language of each message, so the loop turns a chore into three quick judgments.',
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
    challenge: {
      text: "For each of three messages, print the message, an arrow, and whether it is a question (a Noul that gives true or false).",
      hints: [
        "Keep the loop and the list. Replace the Choice block inside the join with a Noul block.",
        "The Noul question is \"Is this message a question?\" about the loop variable.",
        "Make one of the three messages a statement so you see a false in the output.",
      ],
      calls: 3,
      solution: ws(
        forEach(
          'message',
          list(text('Can I change my delivery address?'), text('Thanks, the package arrived today.'), text('Do you ship to Portugal?')),
          print(join(get('message'), text('  →  '), noul('Is this message a question?', get('message')))),
        ),
      ),
    },
  },
  {
    id: 'counting',
    title: '7. Counting with a loop',
    concept:
      'A counter is a variable that starts at 0 and grows inside a loop. After the loop it holds a total. This pattern is everywhere in programming.',
    theory: [
      "A counter is a variable that starts at 0 and grows inside a loop. \"change positive by 1\" adds one to it. When the loop ends, the counter holds a total you could not know before running.",
      "Notice the shape: set to 0 before the loop, change inside the loop, print after. Almost every summary in programming (totals, averages, maxima) follows this shape.",
      "Inside the loop an \"if\" guards the increment: only reviews Jev judges positive count. The judgment is per item; the arithmetic is yours.",
    ],
    jev: 'The loop asks a Noul whether each review is positive and adds 1 when it is. Three small judgments become one useful number.',
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
    challenge: {
      text: "Count how many of three messages are questions, and print \"Questions: N of 3\".",
      hints: [
        "Rename the counter to questions and change the Noul question to \"Is this message a question?\".",
        "Change the three list items so at least one is a statement.",
        "Update the final print so it says Questions instead of Positive reviews.",
      ],
      calls: 3,
      solution: ws(
        seq(
          set('questions', num(0)),
          forEach(
            'message',
            list(
              text('Where can I download my invoice?'),
              text('Everything works now, thank you.'),
              text('Is there a student discount?'),
            ),
            ifElse(noul('Is this message a question?', get('message')), change('questions', 1)),
          ),
          print(join(text('Questions: '), get('questions'), text(' of 3'))),
        ),
      ),
    },
  },
  {
    id: 'logic',
    title: '8. Combining conditions',
    concept:
      '"and", "or" and "not" combine true/false values. "A and B" is true only when both are. This lets one "if" express a rule with several parts.',
    theory: [
      "\"and\", \"or\" and \"not\" combine truth values. A and B is true only when both are; A or B when at least one is; not A flips it. With these three you can write any rule.",
      "A rule with several parts is clearer when each part is its own judgment. \"Is it urgent?\" and \"Is the writer angry?\" are two simple Nouls; the rule that combines them is visible in the blocks, not hidden in a long question.",
      "Keeping judgments separate also makes them reusable: the same \"is angry\" Noul can feed several different rules.",
    ],
    jev: 'Two separate Nouls, urgent and angry, are combined with "and". Keeping judgments separate keeps each one simple and lets you reuse them.',
    calls: 3,
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
    challenge: {
      text: "Print \"Priority\" when a message is urgent or angry, but only if it is not spam; otherwise print \"Normal\". Use three separate Nouls.",
      hints: [
        "The condition has the shape: (urgent or angry) and not spam.",
        "Build the inner \"or\" first, then put it in the A slot of an \"and\" block, with a \"not\" block in the B slot.",
        "The third Noul asks \"Is this message spam or an unsolicited advertisement?\".",
      ],
      calls: 3,
      solution: ws(
        seq(
          set('message', text('URGENT: your account will be closed unless you click this link and confirm your password now!!!')),
          ifElse(
            and(
              or(
                noul('Does the writer need something done urgently?', get('message')),
                noul('Is the writer angry?', get('message')),
              ),
              not(noul('Is this message spam or an unsolicited advertisement?', get('message'))),
            ),
            print(text('Priority')),
            print(text('Normal')),
          ),
        ),
      ),
    },
  },
  {
    id: 'functions',
    title: '9. Functions',
    concept:
      'A function wraps blocks under a name so you can call them again with different inputs. "text" is a parameter: a variable that receives whatever you pass in.',
    theory: [
      "When the same blocks are needed in two places, wrap them in a function: a named group of blocks. Calling the function by name runs the group. Change the group once and every call changes.",
      "A function can take inputs, called parameters. \"mood of\" takes text; each call passes a different value, and inside the function the name text refers to whatever was passed.",
      "A function can return a value, so a call can sit inside a join, a print, or a comparison, like any other value. Here the function wraps one Jev judgment, which is the natural unit to reuse.",
    ],
    jev: 'The function "mood of" wraps one Choice and returns its label. Calling it twice reuses the same judgment on two messages without copying blocks.',
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
    challenge: {
      text: "Define a function \"is urgent\" with one parameter, text, that returns a Noul (true or false). Call it on two different messages and print both results with a label.",
      hints: [
        "Open Functions and use the \"to ... return\" block. Rename it, then use the gear to add a parameter named text.",
        "Put a Noul block in the return slot, asking \"Does the writer need something done urgently?\" about text.",
        "Call the function from two print blocks: join a label like \"First: \" with the call.",
      ],
      calls: 2,
      solution: ws(
        seq(
          print(join(text('First: '), callReturn('is urgent', ['text'], [text('The server room is flooding, call facilities immediately.')]))),
          print(join(text('Second: '), callReturn('is urgent', ['text'], [text('Whenever you have a moment, could you share the slides?')]))),
        ),
        { variables: [{ name: 'text', id: 'param_text' }] },
        [
          {
            x: 20,
            y: 180,
            ...defReturn('is urgent', ['text'], null, noul('Does the writer need something done urgently?', get('text'))),
          },
        ],
      ),
    },
  },
  {
    id: 'assistant',
    title: '10. A small assistant',
    concept:
      'Real programs combine everything: a list, a loop, variables, functions, decisions and numbers. Read this one top to bottom and name each idea from lessons 1 to 9.',
    theory: [
      "Real programs are the nine ideas so far, combined. Read this one from the top: a counter, a list, a loop, a function call, a variable, a Score, a print, an if with a comparison, and a final print.",
      "Notice the division of labour. Jev answers narrow questions: which category, how urgent. Your blocks hold the policy: what counts as urgent, what to print, what to count. Change the policy and nothing about the questions changes.",
      "This is the habit to keep: ask the model for a judgment, keep the rules in code, and let the output show both, so you can see why the program did what it did.",
    ],
    jev: 'For every message the assistant asks a Choice for the category and a Score for urgency, then code decides what to do. Jev supplies judgment; the rules stay in your blocks.',
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
    challenge: {
      text: "Add a second counter, priority, that grows only when the category is billing and the urgency is above 1.5. Print both totals at the end.",
      hints: [
        "Add \"set priority to 0\" next to the urgent counter, before the loop.",
        "Inside the loop add an \"if\" whose condition is an \"and\": a text compare (category = billing) and a number compare (urgency > 1.5).",
        "Add a final print for \"Priority messages: \" joined with the priority variable.",
      ],
      calls: 6,
      solution: ws(
        seq(
          set('urgent', num(0)),
          set('priority', num(0)),
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
              ifElse(
                and(compare('EQ', get('category'), text('billing')), compare('GT', get('urgency'), num(1.5))),
                change('priority', 1),
              ),
            ),
          ),
          print(join(text('Urgent messages: '), get('urgent'))),
          print(join(text('Priority messages: '), get('priority'))),
        ),
        { variables: [{ name: 'text', id: 'param_text' }] },
        [
          {
            x: 20,
            y: 480,
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
  },
];
