/** Editable diagrams for the lesson narration. Values are illustrative, never live Jev results. */
const C = { ink:'#25211c', muted:'#6d6358', paper:'#fbf9f5', line:'#cdc1b2', jev:'#7557c7', logic:'#667985', text:'#4c827f', vars:'#976f5c', loops:'#448272', math:'#526fac', mark:'#ad5a2d' };
export const escape = (s: string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const label = (x:number,y:number,s:string,size=24,color=C.ink,anchor='start',cls='') => `<text class="${cls}" x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="500">${escape(s)}</text>`;
const group = (s:string,word='',cls='') => `<g class="beat ${cls}" data-word="${escape(word)}">${s}</g>`;
function box(x:number,y:number,w:number,h:number,text:string,color=C.jev,shape='round') {
  const path = shape==='bool' ? `<path d="M${x+18},${y}H${x+w-18}l18 ${h/2}-18 ${h/2}H${x+18}l-18 -${h/2}Z"/>` : shape==='block' ? `<path d="M${x+8},${y}h18l6 6h22l6-6h${w-68}q8 0 8 8v${h-16}q0 8-8 8h-${w-68}l-6 6h-22l-6-6h-18q-8 0-8-8v-${h-16}q0-8 8-8Z"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${shape==='square'?10:h/2}"/>`;
  return `<g fill="${color}">${path}</g>${label(x+w/2,y+h/2+8,text,24,'#fff','middle')}`;
}
const wire=(x:number,y:number,x2:number,y2:number) => `<path class="wire" d="M${x},${y} L${x2},${y2}" stroke="${C.line}" stroke-width="3" fill="none"/><circle class="packet" cx="${x}" cy="${y}" r="6" fill="${C.mark}" data-x="${x2-x}" data-y="${y2-y}"/>`;
function output(text:string,detail='') { return group(`<path d="M48 408H672" stroke="${C.line}"/>${label(48,444,'OUTPUT',15,C.muted)}${label(48,482,text,26,C.ink,'start','result')}${detail?label(48,514,detail,18,C.muted):''}`,'print'); }
function note(text:string) { return label(360,382,text,23,C.muted,'middle'); }
const TITLE:Record<string,string[]> = {
 hello:['Instructions have an order','Blocks run in sequence','Print makes a value visible','A fixed text value','A question can be a value','A judgment returns a value','Build your own greeting'],
 variables:['Write it once','Give the value a name','Store it. Read it.','Ask about the same value','A probability is a number','Use the number anywhere','One message, two questions'],
 'if-else':['Give the program a choice','One condition, two branches','Only one branch runs','A judgment can choose the branch','You choose the threshold','Adjust the decision rule','Route a complaint'],
 numbers:['Calculate and compare','A comparison returns a Boolean','Define the scale','Between the levels','The threshold is your rule','Same score, a different rule','Score urgency, then decide'],
 switch:['More than two possibilities','Match one case','Choose the right team','Give each label a meaning','Check the confidence','Make room for uncertainty','Build a language router'],
 'lists-loops':['A list keeps values in order','Several values, one list','Repeat for each item','One body, three runs','One judgment per message','From one item to every item','Ask about each message'],
 counting:['Start the counter at zero','Add one when it counts','Before. Inside. After.','The shape of a summary','Count only matching items','Three judgments, one total','Count the questions'],
 logic:['Combine truth values','Three ways to combine','Build a rule from smaller parts','Separate the judgments','Keep the rule visible','Reuse a judgment','Add the spam check'],
 functions:['Name a reusable group','Call the same definition','Pass a different input','A parameter holds the input','Return a value','Reuse the question','Define your own judgment'],
 assistant:['Put the ideas together','Follow the program','Questions and rules','Jev supplies judgments','Your code holds the policy','Adjust the policy','Make decisions visible','Add a priority counter'],
};

function sequence(i:number) {
  if(i===6) return group(box(70,150,580,56,'print “¡Hola, mundo!”',C.text,'block'),'greeting')+group(box(70,225,580,56,'print Noul: greeting?',C.jev,'block'),'greeting')+group(box(70,300,580,56,'print Noul: Spanish?',C.jev,'block'),'Spanish')+output('Text → judgment → judgment');
  const a = i===0 ? 'Step 1' : i<3 ? 'print a value' : 'print “Hello, world!”';
  const b = i===0 ? 'Step 2' : i<4 ? 'print another value' : 'print Noul: greeting?';
  return group(box(60,148,600,62,a,C.text,'block'),'first')+wire(360,218,360,250)+group(box(60,262,600,62,b,i<4?C.text:C.jev,'block'),'second')+note(i<2?'Read from top to bottom':i<4?'A block produces a value':'Noul produces true or false')+output(i<3?'The values appear here':i<5?'Hello, world!':'Hello, world!    true','Example result');
}
function meter(i:number,prob=false) {
  const value=prob?'0.95':'1.6';
  const labels=prob?['0 · no','0.5 · unsure','1 · yes']:['0 · rude','1 · neutral','2 · polite'];
  let s=group(box(90,140,540,60,prob?'Noul probability: happy?':'Score: how polite?',C.jev),'Score');
  s+=`<path d="M80 272H640" stroke="${C.line}" stroke-width="12" stroke-linecap="round"/><path class="meter-fill" d="M80 272H${prob?612:528}" stroke="${C.jev}" stroke-width="12" stroke-linecap="round"/>`;
  labels.forEach((t,k)=>s+=group(`<path d="M${80+k*280} 255v34" stroke="${C.muted}" stroke-width="2"/>${label(80+k*280,322,t,21,C.muted,k===0?'start':k===2?'end':'middle')}`,t.split(' · ')[1]));
  s+=group(`<g class="needle"><path d="M${prob?612:528} 244v18" stroke="${C.mark}" stroke-width="3"/>${label(prob?612:528,235,value,26,C.mark,'middle')}</g>`,prob?'nine':'six');
  if(!prob && i>=4) { const x=i===5?584:500; s+=group(`<path d="M${x} 244v105" stroke="${C.ink}" stroke-width="2" stroke-dasharray="5 5"/>${label(360,376,i===5?'1.6 < 1.8 → reply carefully':'1.6 ≥ 1.5 → reply warmly',25,C.ink,'middle')}`,'threshold'); }
  return s+output(prob?'Happiness: 0.95':i===5?'Reply carefully.':i>=4?'Reply warmly.':'Score: 1.6','Illustrative result');
}
function variables(i:number) {
  if(i===4) return meter(i,true);
  if(i===0) return [0,1,2].map((v)=>group(box(65,145+v*77,590,55,v===2?'“What a wonderfl morning!”':'“What a wonderful morning!”',v===2?C.mark:C.text),v===2?'mistakes':'text')).join('')+output('One typo, three places to maintain');
  return group(box(65,140,590,58,'set message to “Wonderful morning!”',C.vars,'block'),'name')+wire(220,205,220,250)+wire(500,205,500,250)+group(box(70,262,285,64,i===6?'Noul: happy?':i===2?'message':i===5?'compare ≥ 0.7':'print message',i===2?C.vars:C.text),'message')+group(box(380,262,275,64,i===6?'Noul: worried?':'Noul probability',C.jev),'probability')+note(i===2?'The name reads the stored value':'Both blocks use the same message')+output(i===6?'Happy: …    Worried: …':'Happiness: 0.93','Example result');
}
function branch(i:number) {
  if(i===5) return group(box(75,135,570,60,'Noul: is this a question?',C.jev),'threshold')+group(box(80,245,265,72,'≥ 0.8',C.logic,'bool'),'Raise')+group(box(375,245,265,72,'≥ 0.3',C.logic,'bool'),'lower')+label(212,359,'Fewer yes answers',21,C.muted,'middle')+label(508,359,'More yes answers',21,C.muted,'middle')+output('Choose the cost of a wrong decision');
  const challenge=i===6;
  return group(box(115,136,490,62,i<3?'condition: true or false':challenge?'Noul: complaint? ≥ 0.7':'Noul: question? ≥ 0.5',C.jev,'bool'),'condition')+wire(280,200,205,263)+wire(440,200,515,263)+group(box(60,275,290,62,challenge?'send to support':'then',C.loops,'block'),'then')+group(box(370,275,290,62,challenge?'send to marketing':'else',i===2?C.line:C.logic,'block'),'else')+label(190,244,'true',20,C.loops,'middle')+label(530,244,'false',20,C.muted,'middle')+note('The other branch is skipped')+output(challenge?'Choose one destination':i>=3?'That is a question.':'Only one branch runs','Example decision');
}
function numbers(i:number) {
  if(i>=2 && i<6) return meter(i);
  if(i===6) return group(box(80,143,560,62,'Score: no rush · soon · right now',C.jev),'urgency')+wire(360,210,360,245)+group(box(120,252,480,66,'urgency > 1',C.logic,'bool'),'above')+note('Above 1: handle today · otherwise: can wait')+output('Print the score and the decision');
  return group(box(60,150,255,70,i===0?'2 + 3':'score',C.math),'values')+group(box(405,150,255,70,i===0?'5':'1.5',C.math),'values')+group(box(155,278,410,70,i===0?'2 + 3 = 5':'score ≥ 1.5',C.logic,'bool'),'compare')+wire(190,225,240,270)+wire(530,225,490,270)+output(i===0?'5':'true or false');
}
function choices(i:number) {
  const labels=i===6?['Spanish','English','French']:['billing','technical','sales'];
  let s=group(box(135,125,450,58,i===6?'Choice: which language?':'Choice: which team?',C.jev),'Choice');
  labels.forEach((l,k)=>{const x=40+k*230;s+=wire(360,188,x+90,230)+group(box(x,242,180,60,l,i===5?C.line:k===0?C.jev:C.logic),' '+l); if(i===3)s+=label(x+90,338,['charges','errors','buying'][k],22,C.muted,'middle');});
  if(i===4)s+=group(label(360,374,'confidence: 0.92',28,C.jev,'middle'),'confidence');
  if(i===5)s+=group(box(135,326,450,54,'otherwise → ask a person',C.mark,'block'),'otherwise');
  return s+output(i===5?'0.41 < 0.6 → ask a person':i===6?'Reply in the chosen language':'Route to billing','Example choice');
}
function loop(i:number,count=false) {
  const items=count?['“Love it!”','“It broke.”','“Excellent.”']:['“Hello!”','“¡Hola!”','“Bonjour!”'];
  let s='';
  items.forEach((t,k)=>s+=group(box(45,125+k*80,245,54,t,C.text),'messages'));
  s+=`<path class="wire" d="M310 134H650V333H310" stroke="${C.loops}" stroke-width="3" fill="none" stroke-dasharray="8 6"/>`;
  s+=group(box(350,165,270,58,count?'Noul: positive?':'for each message',C.loops,'block'),'loop');
  s+=group(box(350,249,270,58,count?'change count by 1':'Choice: language',count?C.vars:C.jev,'block'),count?'one':'Choice');
  s+=wire(292,150,345,192)+wire(292,230,345,192)+wire(292,310,345,192);
  if(count) s+=note(i===0?'Before the loop: set count to 0':i===2?'Initialize → update → report':'Only matching items increment the count');
  else s+=note(i===1?'Store and pass the whole list':'Same body · different current item');
  return s+output(count?(i<2?'count: 0':'Positive reviews: 2 of 3'):i===6?'Hello! → false    How are you? → true':'Hello! → en   ¡Hola! → es   Bonjour! → fr','Illustrative results · one judgment per item');
}
function truthTable() {
  let s='';const x=[65,185,325,475,620];
  ['A','B','A and B','A or B','not A'].forEach((t,k)=>s+=label(x[k],151,t,23,C.ink,'middle'));
  const rows=[['F','F','F','F','T'],['F','T','F','T','T'],['T','F','F','T','F'],['T','T','T','T','F']];
  rows.forEach((row,i)=>{s+=`<path d="M35 ${173+i*48}H685" stroke="${C.line}"/>`;row.forEach((t,j)=>s+=group(label(x[j],205+i*48,t,26,t==='T'?C.loops:C.muted,'middle'),j<2?'':j===2?'both':j===3?'least':'flips'));});
  return s+output('T = true    F = false','Follow one row to compare all three operators');
}
function logic(i:number) {
  if(i===1) return truthTable();
  if(i===0)return group(box(65,148,270,62,'A and B',C.logic,'bool'),'And')+group(box(385,148,270,62,'A or B',C.logic,'bool'),'or')+group(box(215,280,290,62,'not A',C.logic,'bool'),'not')+output('Combine yes/no values');
  const final=i===6;
  return group(box(55,127,275,62,'Noul: urgent?',C.jev,'bool'),'urgent')+group(box(390,127,275,62,'Noul: angry?',C.jev,'bool'),'angry')+wire(192,192,285,232)+wire(527,192,435,232)+group(box(230,239,260,58,final?'or':'and',C.logic,'bool'),final?'or':'and')+(final?group(box(46,327,298,56,'not Noul: spam?',C.jev,'bool'),'spam')+wire(365,300,510,327)+group(box(383,327,290,56,'and',C.logic,'bool'),'only'):note(i===5?'Use the same judgment in another rule':'Two simple questions · one visible rule'))+output(final?'Priority if true · Normal if false':'Escalate to a senior agent now.','Example rule');
}
function functions(i:number) {
  const challenge=i===6;
  return group(box(55,130,610,64,challenge?'define is urgent (text)':'define mood of (text)',C.jev,'block'),'function')+group(box(95,219,530,58,challenge?'return Noul: urgent?':'return Choice: joyful · frustrated · calm',C.jev,'block'),'return')+wire(170,312,220,278)+wire(550,312,500,278)+group(box(45,323,300,54,'call with message A',C.vars),'input')+group(box(375,323,300,54,'call with message B',C.vars),'different')+output(i<2?'One definition · two calls':challenge?'First: true    Second: false':'First: joyful    Second: frustrated','Illustrative results');
}
function assistant(i:number) {
  if(i<2) return group(box(70,127,580,53,'set urgent to 0',C.vars,'block'),'counter')+group(box(70,199,580,53,'for each message → category → urgency',C.loops,'block'),'loop')+group(box(70,271,580,53,'if urgency > 1.5 → change urgent by 1',C.logic,'block'),'comparison')+note('Print the result after the loop')+output('Urgent messages: 2','Illustrative result');
  return label(195,132,'JEV',22,C.jev,'middle')+label(525,132,'YOUR BLOCKS',22,C.ink,'middle')+group(box(50,168,290,58,'Choice: category',C.jev),'category')+group(box(50,258,290,58,'Score: urgency',C.jev),'urgent')+wire(346,195,384,195)+wire(346,285,384,285)+group(box(392,168,275,58,i===5?'urgency > 1.0':'urgency > 1.5',C.logic,'bool'),'policy')+group(box(392,258,275,58,i===7?'count priority':'print and count',C.vars,'block'),'count')+note(i===7?'Priority = billing and urgency > 1.5':'Narrow questions · explicit rules')+output(i===7?'Urgent: 2    Priority: 1':'billing / urgency 2.0 → urgent','Illustrative results');
}
export function sceneMarkup(id:string,index:number) {
 const render:Record<string,(i:number)=>string>={hello:sequence,variables,'if-else':branch,numbers,switch:choices,'lists-loops':i=>loop(i),counting:i=>loop(i,true),logic,functions,assistant};
 const title=TITLE[id]?.[index] ?? 'Try the concept';
 return `<g class="scene" data-scene="${index}">${label(38,60,title,30,C.ink)}<path d="M38 88H682" stroke="${C.line}"/>${render[id](index)}</g>`;
}
