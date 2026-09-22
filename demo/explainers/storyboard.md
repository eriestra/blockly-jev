# Lesson explainers — storyboard and narration

Ten short motion graphics, one per lesson, played inside the lesson card of the
Blockly + Jev demo. Same process as the Almond motion story and the lander
explainer: narration first (one continuous Higgsfield take per lesson, preset
voice Juno, natural pace, no tempo change), sentence cues measured from the real
pauses in the audio (`align.py`), then a GSAP timeline expressed relative to
those cues. The audio element is the master clock; a rAF loop scrubs the paused
timeline. Every sentence has a cue; every beat is timed to its sentence; the
stage never sits still under narration (slow push-in per lesson, drifting grid).

Stage: 960×540 design space, scaled to the card width, expandable to the
viewport. Palette is the demo's own (bone / paper / ink, terracotta mark, violet
for Jev, Blockly's category hues for blocks). Blocks are drawn as simplified
Blockly shapes (rounded statement blocks with a notch, pill reporters), never
screenshots. The output panel is a small paper card with a mono font. Jev is a
violet chip with a pulsing dot; a question travels to it as a packet and comes
back as a typed value.

Legend: S1..Sn = narration sentence n. Beats are relative to the sentence cue.

## 1 · Hello, world (`hello`)

| S | Narration | Beats |
|---|---|---|
| 1 | A program is a recipe: a list of steps the computer follows in order, from top to bottom. | Three empty step rows; a cursor bar lights them top to bottom. |
| 2 | In Blockly, each step is a block, and blocks that snap together run one after the other. | Rows become two statement blocks; the lower one slides up and snaps (small bounce). |
| 3 | Print is your window into the program: whatever value you give it appears in the output. | Output card rises on the right; a dot travels from print to the card. |
| 4 | The first print holds a fixed piece of text, Hello, world. | Green text pill plugs into print 1; output line 1 types "Hello, world!". |
| 5 | The second print holds a question instead: a Noul block that asks Jev whether this text is a greeting. | Violet Noul pill plugs into print 2; question text appears inside. |
| 6 | When the program runs, Jev reads the text and hands back true or false, and to the program that is just another value. | Packet travels to the Jev chip, chip pulses, "true" returns and prints as output line 2. |
| 7 | Now your turn: print a greeting in another language, then print two Nouls about it, one asking whether it is a greeting, and one asking whether it is written in Spanish. | Challenge card: three outlined prints; "¡Hola, mundo!" then two dashed Noul slots labelled greeting? / Spanish?. |

## 2 · Variables (`variables`)

| S | Narration | Beats |
|---|---|---|
| 1 | Typing the same text three times invites mistakes. | Three text pills with the same sentence; the third one gets a typo that flashes red. |
| 2 | A variable gives a value a name, so you write it once and refer to it by name everywhere else. | Pills collapse into one "set message to" block; two small "message" pills sprout from it. |
| 3 | Set message to stores the text under the name message, and the round message block reads it back. | Set block highlights, then the round reporter highlights; arrow between them. |
| 4 | The program prints the message, then asks a Noul probability about it: does the writer sound happy. | Print 1 shows the message in the output; print 2 with a violet "Noul probability" pill. |
| 5 | The answer is a number between zero and one: zero point nine five is a confident yes, zero point zero five a confident no, and zero point five means Jev cannot tell. | A 0–1 meter; the needle visits 0.95, 0.05, 0.5 with labels. |
| 6 | Because it is a number, you can store it, compare it, add it, and print it like any other value. | The number drops into three tiny slots: set, compare, print; output prints "Happiness: 0.93". |
| 7 | Your turn: store a message in a variable, then print two probabilities about it, how likely the writer sounds happy, and how likely they sound worried. | Challenge card: set + two prints with dashed probability slots: happy / worried. |

## 3 · If and else (`if-else`)

| S | Narration | Beats |
|---|---|---|
| 1 | So far every block ran, and programs get interesting when they choose. | Straight rail of blocks; the rail forks into two paths. |
| 2 | If, then, else looks at a condition, a value that is true or false, and runs only one of its two branches. | If block appears with a diamond condition slot; then/else pockets labelled. |
| 3 | The branch that does not run is simply skipped. | A runner dot goes down the then branch; the else branch greys out. |
| 4 | Here the condition is a Noul asking whether the message is a question, and the if Noul block folds the question and the decision into one. | Violet "if Noul" block with the question text; message pill shows "Could you send me the invoice again?". |
| 5 | Yes if at least zero point five is the threshold: yes wins when the probability of yes reaches that number. | Meter with a threshold tick at 0.5; needle lands at 0.91, then branch lights, output prints "That is a question." |
| 6 | Raise the threshold when a wrong yes is costly, and lower it when a missed yes is costly. | Threshold tick slides to 0.8 (label "costly yes") then to 0.3 ("costly miss"). |
| 7 | Your turn: decide whether a message is a complaint, print send to support when it is and send to marketing otherwise, and only call it a complaint when Jev is at least zero point seven sure. | Challenge card: if Noul "complaint?" with threshold 0.7; two prints. |

## 4 · Numbers and comparisons (`numbers`)

| S | Narration | Beats |
|---|---|---|
| 1 | Numbers are values you can calculate with and compare. | Number pills drift in; a small "+" joins two of them. |
| 2 | The compare block takes two values and an operator, such as less than, equal, or at least, and produces true or false, which any if can use. | Compare block; operator flips through <, =, ≥; result badge true/false. |
| 3 | A Score turns text into a number on a scale you define: here zero means rude, one means neutral, and two means polite. | A three-stop scale 0·1·2 with the level texts appearing under each stop. |
| 4 | Jev returns the expected position on that scale, so one point six means between neutral and polite, closer to polite. | Needle lands at 1.6 between stops 1 and 2. |
| 5 | Because the result is a number, the threshold lives in your code: at least one point five means reply warmly, anything less means reply carefully. | Threshold tick at 1.5; if block with "politeness ≥ 1.5"; output "Reply warmly." |
| 6 | Change the comparison and the program behaves differently without asking Jev anything new. | Tick slides to 1.8; output flips to "Reply carefully."; Jev chip stays dark (no call). |
| 7 | Your turn: score a message's urgency on three levels, no rush, soon, right now, print the score, then print handle today when it is above one, and can wait otherwise. | Challenge card: Score with three levels; compare > 1; two prints. |

## 5 · Choosing between many options (`switch`)

| S | Narration | Beats |
|---|---|---|
| 1 | Two branches are often not enough. | An if/else fork; a third and fourth path try to squeeze in and jitter. |
| 2 | A switch lists several cases and runs exactly one of them, the one that matches, and it reads better than a pile of nested ifs. | Nested ifs stack collapses; a clean switch block with three cases replaces it. |
| 3 | Switch Choice asks Jev to pick one of your cases: which team should handle this ticket, billing, technical, or sales. | Ticket pill "I was charged twice…"; cases labelled billing / technical / sales. |
| 4 | Each case has a label, which becomes the answer, and a description that tells Jev what the label covers, and good descriptions matter more than clever labels. | Case rows split into label + description; descriptions highlight. |
| 5 | Jev also reports confidence, how concentrated its pick was. | Three bars: billing tall, others short; a "confidence 0.92" badge. |
| 6 | The otherwise branch runs when confidence is below the limit you set, so unclear tickets go to a person instead of a wrong team. | Bars flatten to near-equal; confidence 0.41 < 0.6; otherwise branch lights; output "Not sure. Ask a person." |
| 7 | Your turn: build a language router that replies in Spanish, English, or French depending on the message, and otherwise asks which language this is. | Challenge card: switch with es / en / fr and an otherwise. |

## 6 · Lists and loops (`lists-loops`)

| S | Narration | Beats |
|---|---|---|
| 1 | A list holds several values in order: three messages, ten scores, a hundred names. | Three pills line up in a bracketed list; index chips 1 2 3. |
| 2 | You build one with create list with, and it behaves as a single value you can store and pass around. | "create list with" block wraps them; the whole list shrinks into a single pill and slides into a set block. |
| 3 | A loop repeats blocks: for each item in list runs its body once per element, and each time puts the current element into the loop variable. | For-each block with a body; a highlight ring cycles item 1, 2, 3 into the "message" variable slot. |
| 4 | Three messages, three runs, no copy and paste. | Three ghost copies of the body appear then collapse into one. |
| 5 | Put a Jev block inside the loop and it runs once per item: here a Choice names the language of each message, English, Spanish, or French. | Choice pill inside the body; three packets to Jev; output lines "Where is my order? → en", "…→ es", "…→ fr" appear one per cycle. |
| 6 | That is how a judgment about one message becomes a judgment about every message. | One Jev chip pulse becomes three dots over the three list rows. |
| 7 | Your turn: for each of three messages, print the message, an arrow, and a Noul saying whether it is a question. | Challenge card: loop with print(join(message, →, Noul question?)). |

## 7 · Counting with a loop (`counting`)

| S | Narration | Beats |
|---|---|---|
| 1 | A counter is a variable that starts at zero and grows inside a loop. | "set positive to 0" block; a big counter digit "0" on the right. |
| 2 | Change positive by one adds one to it, and when the loop ends, the counter holds a total you could not know before running. | "change positive by 1" block pulses; digit ticks 0→1→2 as the loop ring cycles. |
| 3 | Notice the shape: set to zero before the loop, change inside the loop, print after. | Three blocks labelled before / inside / after with brackets. |
| 4 | Almost every summary in programming, totals, averages, maxima, follows this shape. | Chips "total", "average", "maximum" fall into the same three-part frame. |
| 5 | Inside the loop an if guards the increment: only reviews Jev judges positive count, so the judgment is per item and the arithmetic is yours. | Three review pills; Noul packets: yes, no, yes; the change block fires only twice. |
| 6 | Three small judgments become one useful number: positive reviews, two of three. | Output prints "Positive reviews: 2 of 3". |
| 7 | Your turn: count how many of three messages are questions, and print questions, N of three. | Challenge card: counter "questions", Noul "question?", print "Questions: N of 3". |

## 8 · Combining conditions (`logic`)

| S | Narration | Beats |
|---|---|---|
| 1 | And, or, and not combine truth values. | Three operator blocks appear: and / or / not. |
| 2 | A and B is true only when both are, A or B when at least one is, and not A flips it. | Mini truth tables light up cell by cell for each operator. |
| 3 | With these three you can write any rule. | The three blocks assemble into a small tree. |
| 4 | A rule with several parts is clearer when each part is its own judgment: is it urgent, and is the writer angry, are two simple Nouls. | Two violet Nouls slide into an "and" block; message pill "Fix my account TODAY or I cancel." |
| 5 | The rule that combines them is visible in the blocks, not hidden in a long question. | A long muddled question pill shakes and fades; the block tree stays crisp. |
| 6 | Keeping judgments separate also makes them reusable: the same is angry Noul can feed several different rules. | The "angry" Noul duplicates into a second rule below. Output: "Escalate to a senior agent now." |
| 7 | Your turn: print priority when a message is urgent or angry, but only if it is not spam, and normal otherwise, using three separate Nouls. | Challenge card: (urgent or angry) and not spam; two prints. |

## 9 · Functions (`functions`)

| S | Narration | Beats |
|---|---|---|
| 1 | When the same blocks are needed in two places, wrap them in a function: a named group of blocks. | Two identical block groups; a frame wraps one, titled "mood of"; the other fades. |
| 2 | Calling the function by name runs the group, and if you change the group once, every call changes. | Two "mood of" call pills; editing the function body ripples a highlight to both calls. |
| 3 | A function can take inputs, called parameters: mood of takes text, and each call passes a different message. | Parameter slot "text" on the frame; two messages slide into the two calls. |
| 4 | Inside the function, the name text refers to whatever was passed in. | The message flows into the frame and replaces the "text" pill. |
| 5 | A function can return a value, so a call can sit inside a join or a print like any other value. | Return slot lights; the call pill nests inside a print. |
| 6 | Here the function wraps one Choice, joyful, frustrated, or calm, and calling it twice reuses the same judgment on two messages without copying blocks. | Two packets to Jev; output "First: joyful", "Second: frustrated". |
| 7 | Your turn: define a function is urgent with one parameter, text, that returns a Noul, then call it on two different messages and print both results with a label. | Challenge card: function "is urgent" returning a Noul; two prints. |

## 10 · A small assistant (`assistant`)

| S | Narration | Beats |
|---|---|---|
| 1 | Real programs are the nine ideas so far, combined. | Nine small chips (lessons 1–9) orbit in and settle as a column. |
| 2 | Read this one from the top: a counter, a list, a loop, a function call, a variable, a Score, a print, an if with a comparison, and a final print. | The full program outline; a cursor walks each block as it is named. |
| 3 | Notice the division of labour. | Stage splits: violet zone left (Jev), ink zone right (your blocks). |
| 4 | Jev answers narrow questions: which category, how urgent. | Two chips land in the violet zone: Choice "category", Score "urgency". |
| 5 | Your blocks hold the policy: what counts as urgent, what to print, what to count. | Three chips land in the ink zone: "> 1.5", print, counter. |
| 6 | Change the policy and nothing about the questions changes. | Threshold flips 1.5 → 1.0; violet zone stays still (no pulse). |
| 7 | This is the habit to keep: ask the model for a judgment, keep the rules in code, and let the output show both, so you can see why the program did what it did. | Output card with three lines "technical / urgency 1.8: …", "billing / urgency 2.0: …", "sales / urgency 0.2: …" then "Urgent messages: 2". |
| 8 | Your turn: add a second counter, priority, that grows only when the category is billing and the urgency is above one point five, and print both totals at the end. | Challenge card: second counter "priority"; and-condition; two final prints. |

## Implementation update · 2026-09-21

Delivery uses a responsive 720×540 diagram stage (4:3 for legibility in the narrow
lesson column), with an expanded player. Diagrams are editable vector geometry,
not encoded video. Scene changes use measured sentence cues; entering parts use
pause-anchored word estimates where a key term matches. Packets travel along
connections, meters draw, and results change with the narrated concept.
The IACC global sequence match replaces the earlier greedy match. English phrase
word estimates are explicitly approximate. Narration never changes speed.

Juno (Higgsfield, ElevenLabs engine) remains the voice. Eight previously prepared
takes are preserved; `hello` and `lists-loops` complete the set. Every lesson has
captions, a transcript, playback controls, seeking, replay, mute, and expansion.
Reduced motion presents the same meaningful states with spatial motion removed.
