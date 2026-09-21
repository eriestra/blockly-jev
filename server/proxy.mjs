// Minimal proxy that keeps TYPESAFE_API_KEY on the server.
// POST /api/systemone  { state, questions, model? }  ->  System One response JSON
import http from 'node:http';
import { TypeSafeClient } from '@typesafe-ai/sdk';

const port = Number(process.env.JEV_PROXY_PORT ?? 8787);
const client = new TypeSafeClient(); // reads TYPESAFE_API_KEY, TYPESAFE_DEFAULT_MODEL

const MAX_BODY = 256 * 1024;
const ALLOWED_TYPES = new Set(['noul', 'choice', 'score']);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function validate(body) {
  if (!body || typeof body !== 'object') throw new Error('body must be an object');
  if (!('state' in body)) throw new Error('missing state');
  const q = body.questions;
  if (!q || typeof q !== 'object' || Object.keys(q).length === 0) throw new Error('missing questions');
  for (const [id, question] of Object.entries(q)) {
    if (!question || !ALLOWED_TYPES.has(question.type)) throw new Error(`question ${id}: bad type`);
  }
  const model = typeof body.model === 'string' ? body.model : undefined;
  return { state: body.state, questions: q, model };
}

function send(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST' || req.url !== '/api/systemone') return send(res, 404, { error: 'not found' });
  try {
    const request = validate(JSON.parse(await readBody(req)));
    const result = await client.systemOne(request);
    send(res, 200, result);
  } catch (err) {
    const status = err?.status ?? 400;
    send(res, status, { error: err?.message ?? String(err) });
  }
});

server.listen(port, () => {
  console.log(`jev proxy listening on http://localhost:${port}/api/systemone`);
});
