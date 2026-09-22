/** Acceptance through the user's Fastloop rig; restores viewport in finally. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
if(!process.env.FASTLOOP_MODULE)throw Error('Set FASTLOOP_MODULE to almond-fastloop.mjs');
const {connect,sleep}=await import(pathToFileURL(process.env.FASTLOOP_MODULE));
const url=process.env.BIT_TEST_URL||'https://sites.almond.build/blockly-jev/';
const c=await connect(new URL(url).pathname);
const shadow="document.querySelector('bit-widget')?.shadowRoot";
async function until(fn,label){for(let i=0;i<90;i++){const v=await fn();if(v)return v;await sleep(350)}throw Error('Timed out: '+label+'; '+await c.eval(`document.querySelector('bit-widget')?.shadowRoot.querySelector('.answer')?.textContent`))}
async function click(selector,widget=true){
 await c.send('Page.bringToFront');await sleep(60);
 const pos=await c.eval(`(()=>{const e=${widget?shadow:'document'}.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 for(const type of ['mouseMoved','mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,...pos,button:'left',clickCount:1});await sleep(100);
}
async function ask(text,expected){
 await click('input');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:4,commands:['selectAll']});await c.send('Input.insertText',{text});
 await until(()=>c.eval(`${shadow}.querySelector('input').value===${JSON.stringify(text)}`),'typed input');
 await click('.ask');await until(()=>c.eval(`!${shadow}.querySelector('.ask').disabled && ${shadow}.querySelector('.answer').dataset.answer===${JSON.stringify(expected)}`),'answer '+expected);
 console.log(JSON.stringify({input:text,...await c.eval(`({answer:${shadow}.querySelector('.answer').textContent,kind:${shadow}.querySelector('.answer').dataset.answer})`)}));
}
const shots=process.env.BIT_SCREENSHOTS||'demo/bit/.impeccable/review/compact';await fs.mkdir(shots,{recursive:true});
async function shot(name){const {data}=await c.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(shots,name+'.png'),Buffer.from(data,'base64'))}
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await c.send('Page.navigate',{url:url.split('#')[0]+'#hello'});
 await until(()=>c.eval(`document.readyState==='complete'&&!!${shadow}?.querySelector('canvas')&&document.querySelector('#lesson-text h3')?.textContent==='Hello, world'`),'ready');await sleep(300);
 assert.equal(await c.eval("document.querySelector('#lesson-text').firstElementChild.classList.contains('explainer')"),true);
 await shot('desktop');await click('.shape');await until(()=>c.eval(`!${shadow}.querySelector('.panel').hidden`),'panel open');await shot('desktop-open');
 assert.equal(await c.eval(`${shadow}.querySelectorAll('.sound,.topic,h2,label,.close').length`),0);
 await ask('Instuctions can contain more instructions','yes');await sleep(400);await shot('statement-yes');
 await ask('Print never shows a value in the output','no');
 await ask('Is the moon made of cheese?','unknown');
 await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await sleep(100);
 await until(()=>c.eval(`${shadow}.querySelector('.panel').hidden`),'Escape close');
 assert.equal(await c.eval(`${shadow}.activeElement?.className`),'shape');
 await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(300);await shot('mobile');await click('.shape');await until(()=>c.eval(`!${shadow}.querySelector('.panel').hidden`),'mobile panel open');await shot('mobile-open');
 assert.equal(await c.eval('document.documentElement.scrollWidth'),390);
 assert.equal(await c.eval(`getComputedStyle(${shadow}.querySelector('.shape')).backgroundColor`),'rgba(0, 0, 0, 0)');
 const errors=c.events.filter(e=>e.method==='Runtime.exceptionThrown');assert.equal(errors.length,0);
 console.log('Passed: statement yes, false statement no, unrelated unknown, explainer first, compact controls, keyboard, alpha, desktop/mobile.');
}finally{await c.send('Emulation.clearDeviceMetricsOverride');await sleep(150);console.log('Normal browser viewport restored.');c.ws.close()}
