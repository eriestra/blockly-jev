// Capture 1920x1080 frames of the live demo through the fastloop Chrome DevTools port.
// Usage: node shoot.mjs <name> <hash> [script]   (script is JS run in the page before the shot)
import { writeFileSync } from 'node:fs';

const [name, hash, script = ''] = process.argv.slice(2);
const base = 'http://localhost:9333';
const url = `https://sites.almond.build/blockly-jev/#${hash}`;

const target = await (await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Runtime.enable');
for (let i = 0; i < 60; i++) { if (await evaluate('!!window.workspace && document.getElementById("code").textContent.length > 50')) break; await new Promise((r) => setTimeout(r, 300)); }
await evaluate('document.body.style.zoom = "1"; window.dispatchEvent(new Event("resize")); true');
if (script) await evaluate(`(async () => { ${script} })()`);
await new Promise((r) => setTimeout(r, 400));
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(`${name}.png`, Buffer.from(shot.result.data, 'base64'));
await fetch(`${base}/json/close/${target.id}`);
ws.close();
console.log(`${name}.png`);
