/** Build immutable assets, preview, then explicitly activate a verified revision. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [mode,release]=process.argv.slice(2);
if(!['prepare','activate'].includes(mode)||!release||!/^[a-z0-9-]+$/.test(release))throw Error('Usage: node scripts/publish-almond.mjs prepare|activate <release-name>');
const authFile=process.env.ALMOND_SITE_CONFIG||path.join(os.homedir(),'.almond-private/blockly-jev-site.json');
const auth=JSON.parse(await fs.readFile(authFile,'utf8'));
if(auth.endpoint!=='https://almond.build/mcp')throw Error('Credentials must belong to production Almond');
const args={siteId:auth.siteId,writeToken:auth.writeToken};
const receiptFile=path.join(path.dirname(authFile),`blockly-jev-release-${release}.json`);
async function call(name,input){
 const res=await fetch(auth.endpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method:'tools/call',params:{name,arguments:input}})});
 const raw=await res.text();let result;
 try{result=JSON.parse(raw)}catch{result=JSON.parse(raw.split('\n').find(line=>line.startsWith('data: ')).slice(6))}
 if(result.error||result.result?.isError)throw Error(`Almond ${name} failed`);
 return result.result.structuredContent||JSON.parse(result.result.content.find(c=>c.type==='text').text);
}
if(mode==='activate'){
 const receipt=JSON.parse(await fs.readFile(receiptFile,'utf8'));
 receipt.activation=await call('page_activate',{...args,slug:'index',revision:receipt.preview.revision,baseRevision:receipt.preview.baseRevision,intent:receipt.intent});
 await fs.writeFile(receiptFile,JSON.stringify(receipt,null,2),{mode:0o600});console.log(JSON.stringify(receipt.activation));
}else{
 const context=await call('site_context',args);
 const base=context.pages.find(p=>p.slug==='index')?.liveRevision;
 const prefix=`releases/${release}/`,baseUrl=`https://sites.almond.build/a/blockly-jev/${prefix}`;
 execFileSync('npm',['run','build:demo:almond','--','--base',baseUrl],{cwd:root,stdio:'inherit'});
 const dir=path.join(root,'demo-dist-almond');
 const files=(await fs.readdir(dir,{recursive:true,withFileTypes:true})).filter(f=>f.isFile()&&f.name!=='index.html'&&!f.name.startsWith('.')).map(f=>path.relative(dir,path.join(f.parentPath,f.name)));
 const receipt={release,assets:{},intent:'Make the floating Bit widget compact: only input, send button and answer; remove sound and helper text. Accept topic-related true/false statements with spelling mistakes as well as yes/no questions, preserve actual exercise reactions, put the narrated motion graphics first in the lesson panel, and include all widget source in the normal reproducible repository build.'};
 const types={'.js':'text/javascript','.css':'text/css','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.cur':'image/x-icon'};
 for(const file of files){
  const upload=await call('asset_upload_url',args);
  const res=await fetch(upload.uploadUrl,{method:'POST',headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream'},body:await fs.readFile(path.join(dir,file))});
  if(!res.ok)throw Error('Upload failed: '+file);
  const {storageId}=await res.json();const asset=await call('asset_register',{...args,path:prefix+file,storageId});
  if((asset.url||asset.publicUrl)!==baseUrl+file)throw Error('Unexpected asset URL: '+file);
  receipt.assets[file]=asset.url||asset.publicUrl;
 }
 const html=await fs.readFile(path.join(dir,'index.html'),'utf8');
 receipt.preview=await call('page_publish',{...args,slug:'index',html,activate:false,intent:receipt.intent});
 await fs.writeFile(receiptFile,JSON.stringify(receipt,null,2),{mode:0o600});
 if(base!==receipt.preview.baseRevision)throw Error('Live page changed while preparing; inspect before activating');
 console.log(JSON.stringify(receipt.preview));
}
