import { gsap } from 'gsap';
import cueData from './explainers/cues.json';
import { sceneMarkup, escape } from './explainer-scenes';
import { icon } from './canvas-controls';
import { Narration } from './narration';

type Cue = { i:number; text:string; start:number; end:number; words:[string,number][]; wordEnds:number[] };
type Track = { total:number; cues:Cue[] };
const tracks = cueData as unknown as Record<string,Track>;
const timeLabel = (t:number) => `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');

export function createExplainer(id:string,title:string) {
  const track=tracks[id];
  const element=document.createElement('section');
  element.className='explainer'; element.setAttribute('aria-label',`${title} explainer`);
  if(!track) { throw new Error(`Missing narrated explainer: ${id}`); }
  element.innerHTML=`<div class="explainer-heading"><h4>Watch the concept</h4><button class="canvas-button expand-player" aria-label="Expand explainer" title="Expand explainer" type="button">${icon('expand')}</button></div>
    <div class="explainer-screen"><svg viewBox="0 0 720 540" role="img" aria-label="${escape(title)}: animated example">${track.cues.map((c,i)=>sceneMarkup(id,i)).join('')}</svg><div class="explainer-poster"><button class="explainer-start" type="button">${icon('play')}Watch · ${timeLabel(track.total)}</button></div></div>
    <div class="explainer-controls" role="group" aria-label="Explainer playback">
      <button class="canvas-button play-pause" type="button" aria-label="Play explainer" title="Play or pause">${icon('play')}</button>
      <input class="explainer-seek" type="range" min="0" max="${track.total}" value="0" step="0.1" aria-label="Explainer progress"/>
      <span class="explainer-time">0:00 / ${timeLabel(track.total)}</span>
      <button class="canvas-button sound-toggle" type="button" aria-label="Mute narration" title="Mute narration" aria-pressed="false">${icon('sound')}</button>
      <button class="canvas-button caption-toggle" type="button" aria-label="Show captions" title="Captions" aria-pressed="true">${icon('captions')}</button>
      <button class="canvas-button replay-player" type="button" aria-label="Replay explainer" title="Replay explainer">${icon('replay')}</button>
    </div>
    <p class="explainer-caption"></p><p class="explainer-error" role="status" hidden></p>
    <details><summary>Read transcript</summary>${track.cues.map(c=>`<p>${escape(c.text)}</p>`).join('')}</details>`;
  const q=<T extends HTMLElement>(s:string)=>element.querySelector<T>(s)!;
  const stage=q<HTMLElement>('.explainer-screen');
  const svg=element.querySelector('svg[role=img]')!;
  const scenes=[...svg.querySelectorAll<SVGGElement>('.scene')];
  const progress=q<HTMLInputElement>('.explainer-seek');
  const play=q<HTMLButtonElement>('.play-pause');
  const caption=q<HTMLElement>('.explainer-caption');
  const poster=q<HTMLElement>('.explainer-poster');
  const error=q<HTMLElement>('.explainer-error');
  const expand=q<HTMLButtonElement>('.expand-player');
  // Publication substitutes this stable path with Almond's registered asset URL.
  const audio=new Narration(`${import.meta.env.BASE_URL}media/${id}.mp3`,track.total);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let timeline:gsap.core.Timeline;
  let currentCue=-1, currentWord=-2, raf=0, disposed=false, starting=false;
  let dialog:HTMLDialogElement|null=null;
  const placeholder=document.createComment('explainer position');
  const buildTimeline=()=>{
    timeline?.kill();
    timeline=gsap.timeline({paused:true});
    for(const [i,scene] of scenes.entries()) {
      const c=track.cues[i], d=Math.max(.5,c.end-c.start);
      const at=c.start;
      gsap.set(scene,{visibility:i===0?'visible':'hidden',opacity:1});
      timeline.set(scene,{visibility:'visible'},i===0?0:at);
      if(i>0)timeline.set(scenes[i-1],{visibility:'hidden'},at);
      scene.querySelectorAll<SVGGElement>('.beat').forEach((node,k)=>{
        const word=normalize(node.dataset.word??'');
        const match=c.words?.find(w=>normalize(w[0])===word);
        const delay=match?Math.min(d*.85,match[1]-at):Math.min(k*.25,d*.35);
        if(!reduced.matches)timeline.fromTo(node,{opacity:0,y:10},{opacity:1,y:0,duration:.35,ease:'power2.out'},at+delay);
        else timeline.set(node,{opacity:1,y:0},at);
      });
      scene.querySelectorAll<SVGPathElement>('.wire,.meter-fill').forEach((p,k)=>{
        const length=p.getTotalLength();
        if(!reduced.matches)timeline.fromTo(p,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:Math.min(1.1,d/3),ease:'power1.inOut'},at+Math.min(.5+k*.1,d/3));
      });
      scene.querySelectorAll<SVGCircleElement>('.packet').forEach((p,k)=>{
        if(reduced.matches){timeline.set(p,{opacity:0},at);return;}
        const duration=Math.max(.8,Math.min(2.5,d/2));
        timeline.fromTo(p,{x:0,y:0,opacity:0},{x:Number(p.dataset.x),y:Number(p.dataset.y),opacity:1,duration,repeat:Math.ceil(d/duration),ease:'power1.inOut'},at+k*.12);
      });
      if(id==='variables' && i===4) {
        const needle=scene.querySelector('.needle')!;
        const value=needle.querySelector('text')!;
        const bar=scene.querySelector('.meter-fill')!;
        const phraseAt=(phrase:string,fallback:number)=>{
          const words=phrase.split(' ');const j=c.words.findIndex((_,j)=>words.every((w,k)=>normalize(c.words[j+k]?.[0]??'')===w));
          return j<0?at+d*fallback:c.words[j][1];
        };
        const changes:[number,number,string][]=[
          [phraseAt('zero point nine five',.25),0,'0.95'],
          [phraseAt('zero point zero five',.52),-504,'0.05'],
          [phraseAt('zero point five',.75),-252,'0.5'],
        ];
        for(const [when,x,text] of changes) {
          timeline.to(needle,{x,duration:reduced.matches?0:.45,ease:'power2.inOut'},when);
          timeline.set(value,{textContent:text},when);
          timeline.to(bar,{attr:{d:`M80 272H${612+x}`},duration:reduced.matches?0:.45},when);
          timeline.set(scene.querySelector('.result'),{textContent:`Happiness: ${text}`},when);
        }
      }
      if(id==='counting' && i===1) {
        const counter=scene.querySelector('.result')!;
        timeline.set(counter,{textContent:'count: 1'},at+d*.22);
        timeline.set(counter,{textContent:'count: 2'},at+d*.64);
      }
      const result=scene.querySelector<SVGTextElement>('.result');
      if(result && !reduced.matches)timeline.fromTo(result,{opacity:.45},{opacity:1,duration:Math.max(1,d/2),repeat:1,yoyo:true,ease:'sine.inOut'},at);
      // The concept stays in motion while it is explained; no free-running CSS clock.
      if(!reduced.matches)timeline.fromTo(scene,{scale:1,transformOrigin:'50% 50%'},{scale:1.025,duration:d,ease:'none'},at);
    }
    timeline.set({}, {},track.total);
    render();
  };
  const render=()=>{
    const t=audio.currentTime||0;
    timeline?.time(Math.min(t,track.total),false);
    if(!poster.hidden && t===0) {
      gsap.set(scenes[0].querySelectorAll('.beat'),{opacity:1,y:0});
    }
    progress.value=String(t);
    progress.setAttribute('aria-valuetext',`${timeLabel(t)} of ${timeLabel(track.total)}`);
    q('.explainer-time').textContent=`${timeLabel(t)} / ${timeLabel(track.total)}`;
    let i=0;
    for(let k=0;k<track.cues.length;k++)if(t>=track.cues[k].start)i=k;
    const c=track.cues[i];
    let word=-1; c.words?.forEach((w,k)=>{if(t>=w[1]&&t<c.wordEnds[k])word=k;});
    if(currentCue!==i||currentWord!==word) {
      caption.innerHTML=c.words?.length?c.words.map((w,k)=>k===word?`<mark>${escape(w[0])}</mark>`:escape(w[0])).join(' '):escape(c.text);
      svg.setAttribute('aria-label',`${title}. ${c.text}`);
      currentCue=i;currentWord=word;
    }
  };
  const tick=()=>{render();if(!audio.paused&&!disposed)raf=requestAnimationFrame(tick);};
  const paintPlay=()=>{play.innerHTML=icon(audio.paused?'play':'pause');play.setAttribute('aria-label',audio.paused?'Play explainer':'Pause explainer');};
  const pause=()=>{audio.pause();cancelAnimationFrame(raf);paintPlay();render();};
  const start=async()=>{
    if(disposed||starting)return;
    starting=true;play.disabled=true;error.hidden=true;
    try {
      if(audio.ended||audio.currentTime>=track.total-.1)audio.currentTime=0;
      await audio.play();
      if(disposed){audio.pause();return;}
      poster.hidden=true;paintPlay();cancelAnimationFrame(raf);tick();
    } catch (cause) {
      if(!disposed && !(cause instanceof DOMException && cause.name==='AbortError')){error.textContent='Narration could not play. Press play to retry, or read the transcript.';error.hidden=false;}
    } finally {starting=false;play.disabled=false;}
  };
  const toggle=()=>audio.paused?void start():pause();
  q('.explainer-start').addEventListener('click',()=>void start());
  play.addEventListener('click',toggle);
  progress.addEventListener('input',()=>{audio.currentTime=Number(progress.value);poster.hidden=true;render();});
  q('.replay-player').addEventListener('click',()=>{audio.currentTime=0;void start();});
  q('.sound-toggle').addEventListener('click',()=>{
    audio.muted=!audio.muted;
    const b=q('.sound-toggle');b.innerHTML=icon(audio.muted?'mute':'sound');
    b.setAttribute('aria-label',audio.muted?'Unmute narration':'Mute narration');b.setAttribute('aria-pressed',String(audio.muted));
  });
  const toggleCaptions=()=>{caption.hidden=!caption.hidden;q('.caption-toggle').setAttribute('aria-pressed',String(!caption.hidden));};
  q('.caption-toggle').addEventListener('click',toggleCaptions);
  audio.addEventListener('ended',()=>{pause();play.innerHTML=icon('replay');play.setAttribute('aria-label','Replay explainer');});
  audio.addEventListener('seeked',render);
  audio.addEventListener('error',()=>{pause();error.textContent='Narration is unavailable. Retry playback or read the transcript.';error.hidden=false;});
  audio.addEventListener('waiting',()=>{play.setAttribute('aria-label','Narration loading');});
  audio.addEventListener('playing',paintPlay);
  audio.addEventListener('pause',()=>{cancelAnimationFrame(raf);paintPlay();render();});
  element.addEventListener('keydown',(e)=>{
    if((e.target as HTMLElement).matches('input,button,summary'))return;
    if(e.code==='Space'){e.preventDefault();toggle();}
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();audio.currentTime=Math.max(0,Math.min(track.total,audio.currentTime+(e.key==='ArrowRight'?5:-5)));render();}
    if(e.key.toLowerCase()==='c')toggleCaptions();
  });
  stage.tabIndex=0;stage.setAttribute('aria-label','Animation. Space to play or pause; arrow keys to seek.');
  const restore=()=>{
    if(!dialog)return;
    placeholder.replaceWith(element);dialog.remove();dialog=null;
    expand.innerHTML=icon('expand');expand.setAttribute('aria-label','Expand explainer');expand.title='Expand explainer';expand.focus();
  };
  expand.addEventListener('click',()=>{
    if(dialog){dialog.close();return;}
    element.before(placeholder);dialog=document.createElement('dialog');dialog.className='explainer-dialog';
    dialog.setAttribute('aria-label',`${title} explainer`);document.body.append(dialog);dialog.append(element);
    expand.innerHTML=icon('close');expand.setAttribute('aria-label','Close expanded explainer');expand.title='Close expanded explainer';
    dialog.addEventListener('close',restore,{once:true});dialog.addEventListener('click',e=>{if(e.target===dialog)dialog?.close();});dialog.showModal();
  });
  const onVisibility=()=>{if(document.hidden)pause();};
  document.addEventListener('visibilitychange',onVisibility);
  const onMotion=()=>{buildTimeline();};reduced.addEventListener('change',onMotion);
  // Pause when the learner scrolls away; expanding remains the same player and clock.
  const visibility=new IntersectionObserver(entries=>{if(entries[0]&&!entries[0].isIntersecting&&!dialog)pause();},{threshold:0});
  visibility.observe(element);
  buildTimeline();
  return {element,dispose(){
    disposed=true;pause();timeline.kill();visibility.disconnect();
    document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onMotion);
    audio.dispose();if(dialog)restore();
  }};
}
