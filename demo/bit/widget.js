import { createBit } from './bit-renderer.js';
import { askWithTimeout } from './bit-question.js';

class BitWidget extends HTMLElement {
 connectedCallback(){
  if(this.shadowRoot)return;
  const root=this.attachShadow({mode:'open'});
  root.innerHTML=`<style>
:host{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom));z-index:90;display:block;width:124px;height:124px;pointer-events:none;font:14px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#29231e;color-scheme:light}
*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible{outline:2px solid #7557c7;outline-offset:2px}::selection{background:#e3d9f8;color:#29231e}
.shape{display:block;width:124px;height:124px;background:transparent;border:0;padding:0;pointer-events:auto;-webkit-tap-highlight-color:transparent;border-radius:16px}.shape:hover{filter:brightness(1.06)}canvas{display:block;width:100%;height:100%}
.panel{position:absolute;right:4px;bottom:122px;width:min(340px,calc(100vw - 32px));padding:10px;background:#fbf9f5;border-radius:12px;box-shadow:0 12px 36px #17130f2e;pointer-events:auto;max-height:calc(100dvh - 155px);overflow:auto;scrollbar-color:#b7aca0 #fbf9f5}
form{display:flex;gap:8px;align-items:center}input{width:100%;min-width:0;border:0;border-radius:6px;background:transparent;color:#29231e;padding:10px 8px;caret-color:#7557c7;font-size:16px;line-height:24px}input::placeholder{color:#766b61}.ask{flex:none;display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:8px;background:#7557c7;color:white}.ask:disabled{opacity:.6;cursor:wait}svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.answer{margin:8px 8px 2px;font-size:13px;line-height:1.5;color:#29231e}.answer[data-answer=yes]{color:#236445}.answer[data-answer=no]{color:#a13022}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
@media(max-width:600px){:host,.shape{width:100px;height:100px}.panel{bottom:102px}}
</style>
<section class="panel" id="bit-panel" aria-label="Ask Bit" hidden>
 <form novalidate><input id="bit-question" aria-label="A question or statement about this lesson" maxlength="400" autocomplete="off" placeholder="Ask or check a statement…" aria-describedby="bit-answer"><button class="ask" type="submit" aria-label="Ask Bit" title="Ask Bit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></form>
 <p class="answer" id="bit-answer" role="status" aria-live="polite" hidden></p>
</section>
<button class="shape" type="button" aria-label="Ask Bit about this lesson" aria-expanded="false" aria-controls="bit-panel" title="Ask Bit about this lesson"></button><span class="sr" role="status" aria-live="polite"></span>`;
  const $=s=>root.querySelector(s), panel=$('.panel'),shape=$('.shape'),answer=$('.answer'),input=$('input'),ask=$('.ask');
  let seq=0,lesson='',render;
  const say=(text,kind='unknown')=>{answer.textContent=text;answer.hidden=!text;answer.dataset.answer=kind;$('.sr').textContent=text;};
  try{render=createBit(shape,{onAudioError:()=>{say(answer.textContent+' Voice unavailable.')}})}catch{shape.textContent='Bit';say('The 3D view is unavailable. You can still ask a question.');}
  const unlock=()=>{void render?.unlock()};
  const response=(value,text)=>{say(text,value);if(render)render.activate(value)};
  const setOpen=open=>{panel.hidden=!open;shape.setAttribute('aria-expanded',String(open));if(open){unlock();input.focus()}else shape.focus()};
  shape.addEventListener('click',()=>setOpen(panel.hidden));
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.stopPropagation();setOpen(false)}});
  const reset=()=>{seq++;ask.disabled=false;ask.setAttribute('aria-label','Ask Bit');render?.activate('neutral');lesson=document.querySelector('#lesson-text h3')?.textContent||'this lesson';input.value='';say('');};
  const runtime=this.runtime;
  if(!runtime)throw Error('Bit requires a Jev runtime');
  $('form').addEventListener('submit',async e=>{
   e.preventDefault();if(ask.disabled)return;if(!input.value.trim()){input.focus();return;}input.focus();unlock();const ticket=++seq;ask.disabled=true;ask.setAttribute('aria-label','Thinking');render?.activate('neutral');say('Thinking…');
   // Only authored, visible lesson prose; no input fields, workspace, storage or hidden solution.
   const context=[...document.querySelectorAll('#lesson-text > h3, #lesson-text > p')].map(e=>e.textContent).join('\n');
   try{
    const result=await askWithTimeout(runtime,context,input.value);
    if(ticket!==seq)return;
    if(result==='unknown')say('I can’t tell from this lesson.');
    else response(result,result==='yes'?'Yes.':'No.');
   }catch{if(ticket===seq)say('Couldn’t reach Jev. Try again.');}
   finally{if(ticket===seq){ask.disabled=false;ask.setAttribute('aria-label','Ask Bit')}}
  });
  const evaluation=e=>{if(e.detail?.lessonId!==location.hash.slice(1))return;seq++;ask.disabled=false;ask.setAttribute('aria-label','Ask Bit');if(typeof e.detail.passed==='boolean')response(e.detail.passed?'yes':'no',e.detail.passed?'Yes. Exercise passed.':'No. Not yet — check the exercise feedback.');};
  window.addEventListener('bit:exercise',evaluation);window.addEventListener('bit:unlock',unlock);window.addEventListener('bit:reset',reset);
  const observe=new MutationObserver(()=>{const title=document.querySelector('#lesson-text h3')?.textContent;if(title&&title!==lesson)reset()});observe.observe(document.querySelector('#lesson-text'),{childList:true});reset();
  this.cleanup=()=>{seq++;observe.disconnect();render?.dispose();window.removeEventListener('bit:exercise',evaluation);window.removeEventListener('bit:unlock',unlock);window.removeEventListener('bit:reset',reset)};
 }
 disconnectedCallback(){this.cleanup?.()}
}
if(!customElements.get('bit-widget'))customElements.define('bit-widget',BitWidget);
export function mountBitWidget(runtime){
 if(document.querySelector('bit-widget'))return;
 const widget=document.createElement('bit-widget');widget.runtime=runtime;document.body.append(widget);
 return widget;
}
