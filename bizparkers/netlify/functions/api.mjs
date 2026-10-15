// Runs the Bizparkers API (enquiries, analytics, admin) as a Netlify Function.
// The website and admin pages themselves are served by Netlify from the built `dist` folder.
import { Readable } from 'node:stream';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// The app is CommonJS; once bundled into this ES module it still needs `require` and `__dirname`.
globalThis.require ??= createRequire(import.meta.url);
globalThis.__filename ??= fileURLToPath(import.meta.url);
globalThis.__dirname ??= dirname(globalThis.__filename);
let appPromise = null;
const loadApp = () => (appPromise ||= import('../../lib/app.js').then(m => m.default || m));

export default async (request, context) => {
  const { handle } = await loadApp();
  const url = new URL(request.url);
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? Buffer.from(await request.arrayBuffer()) : null;

  // a minimal Node-style request/response around the Web Request
  const req = Readable.from(body && body.length ? [body] : []);
  req.method = request.method;
  req.url = url.pathname + url.search;
  req.headers = Object.fromEntries(request.headers);
  req.headers['x-forwarded-proto'] ||= url.protocol.replace(':', '');
  if (context && context.ip) req.headers['x-forwarded-for'] ||= context.ip;
  req.socket = { remoteAddress: (context && context.ip) || '', encrypted: url.protocol === 'https:' };

  return new Promise(resolve => {
    const headers = new Headers();
    let status = 200, done = false;
    const finish = (data) => {
      if (done) return; done = true;
      const empty = status === 204 || status === 304 || request.method === 'HEAD';
      resolve(new Response(empty ? null : (data ?? null), { status, headers }));
    };
    const res = {
      headersSent: false,
      setHeader(k, v) { headers.set(k, String(v)); },
      writeHead(s, h = {}) { status = s; for (const [k, v] of Object.entries(h)) if (v !== undefined) headers.set(k, String(v)); this.headersSent = true; },
      end(data) { this.headersSent = true; finish(data); }
    };
    handle(req, res).then(() => finish(), err => {
      console.error('[bizparkers]', err);
      if (!done) { status = 500; headers.set('Content-Type', 'application/json'); finish(JSON.stringify({ ok: false, error: 'Server error' })); }
    });
  });
};

export const config = { path: ['/api/*', '/healthz'] };
