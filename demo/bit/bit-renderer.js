import * as THREE from 'three';
import audioClips from './audio.json';
import geometryTargets from './geometry.json';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export function createBit(stage,{onAudioError=()=>{}}={}) {
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x080b10,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;stage.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Live 3D morphing Bit');renderer.domElement.setAttribute('role','img');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,50);camera.position.set(0,.1,5.1);camera.lookAt(0,0,0);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.05).texture;room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xb3d9ff,0x152030,1.0));const key=new THREE.DirectionalLight(0xe5f5ff,2.7);key.position.set(-3,4,4);scene.add(key);const rim=new THREE.DirectionalLight(0x518cff,2.8);rim.position.set(2,1,-3);scene.add(rim);
const targets=geometryTargets.map(a=>new THREE.Float32BufferAttribute(a,3)),base=new THREE.BufferGeometry();base.setAttribute('position',targets[0].clone());base.morphAttributes.position=targets;base.computeVertexNormals();
const material=new THREE.MeshPhysicalMaterial({color:0xc1e6ff,metalness:.65,roughness:.27,clearcoat:1,clearcoatRoughness:.16,flatShading:true,emissive:0x12273e,emissiveIntensity:.28});const mesh=new THREE.Mesh(base,material);scene.add(mesh);mesh.rotation.set(.2,.25,.12);
const neutral=new THREE.Color(0xa9d7f3),gold=new THREE.Color(0xffb800),red=new THREE.Color(0xff341b),weights=[1,0,0,0],startWeights=[...weights];let mode='neutral',transitionAt=0,returnAt=0,audioTimer,returnTimer,frame=0,last=0,elapsed=0;let audioContext, source; const buffers={};
async function unlock(){
 try {
 audioContext??=new AudioContext(); await audioContext.resume();
 await Promise.all(Object.entries(audioClips).map(async([key,url])=>{if(!buffers[key]){const res=await fetch(url);if(!res.ok)throw Error('Audio unavailable');buffers[key]=await audioContext.decodeAudioData(await res.arrayBuffer())}}));
 }catch{onAudioError()}
}
function speak(m){
 if(source){try{source.stop()}catch{}};
 if(!audioContext||audioContext.state!=='running'||!buffers[m]){onAudioError();return}
 source=audioContext.createBufferSource();source.buffer=buffers[m];const gain=audioContext.createGain();gain.gain.value=.85;source.connect(gain).connect(audioContext.destination);source.start();
}
function activate(m,audible=true){clearTimeout(returnTimer);mode=m;transitionAt=elapsed;startWeights.splice(0,4,...weights);stage.dataset.state=m;if(m!=='neutral'){if(audible)speak(m);returnTimer=setTimeout(()=>activate('neutral'),1700)}}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
const observer=new ResizeObserver(resize);observer.observe(stage);resize();
function tick(now){frame=requestAnimationFrame(tick);if(document.hidden){last=now;return}const dt=Math.min((now-(last||now))/1000,.05);last=now;elapsed+=dt;const q=Math.min(1,(elapsed-transitionAt)/(reduced?.16:(mode==='neutral'?.62:.30))),ease=q*q*q*(q*(q*6-15)+10);const n=reduced?0:(Math.sin(elapsed*3.6)+1)/2,targetW=mode==='yes'?[0,0,1,0]:mode==='no'?[0,0,0,1]:[1-n,n,0,0];for(let i=0;i<4;i++){weights[i]=THREE.MathUtils.lerp(startWeights[i],targetW[i],ease);mesh.morphTargetInfluences[i]=weights[i]}
material.color.copy(neutral).multiplyScalar(weights[0]+weights[1]).add(gold.clone().multiplyScalar(weights[2])).add(red.clone().multiplyScalar(weights[3]));material.emissive.copy(material.color).multiplyScalar(.12);if(!reduced){mesh.rotation.y+=dt*.22;mesh.rotation.x=.12+Math.sin(elapsed*.32)*.14;mesh.position.y=Math.sin(elapsed*1.15)*.075;mesh.rotation.z=.08+Math.sin(elapsed*.4)*.04}renderer.render(scene,camera)}tick(0);

return {activate,unlock,silence(){if(source){try{source.stop()}catch{}}},dispose(){cancelAnimationFrame(frame);clearTimeout(returnTimer);observer.disconnect();source?.stop();audioContext?.close();base.dispose();material.dispose();scene.environment.dispose();renderer.dispose();renderer.domElement.remove()}};
}
