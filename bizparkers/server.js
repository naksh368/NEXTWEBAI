'use strict';
/*
 * Bizparkers: website + admin panel in one small Node server.
 *   /          the website (public/index.html)
 *   /admin     the admin panel (public/admin/index.html)
 *   /api/...   enquiries, analytics, settings
 * Configure with environment variables (see .env.example).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { createStore } = require('./lib/store');
const { computeStats } = require('./lib/stats');

loadDotEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'bizparkers@gmail.com').trim().toLowerCase();
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(9).toString('base64url');
  console.warn(`[bizparkers] ADMIN_PASSWORD is not set. Temporary admin password for this run: ${ADMIN_PASSWORD}`);
}
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) console.warn('[bizparkers] SESSION_SECRET is not set. Admin sessions will end when the server restarts.');

const PUBLIC_DIR = path.join(__dirname, 'public');
const STATUSES = ['New', 'Contacted', 'Proposal sent', 'Won', 'Lost', 'Spam'];
const SERVICES = ['Website', 'E-commerce', 'Mobile app', 'Web app', 'AI automation', 'AI chatbot', 'Logo & branding',
  'Digital marketing', 'Google SEO', 'Launch kit', 'Growth kit', 'Automate kit', 'Not sure yet'];
const DEFAULT_SETTINGS = {
  email: 'hello@bizparkers.com',
  phone: '+91 72909 11804',
  instagram: 'https://www.instagram.com/bizparkers/',
  available: true,
  announcement: { on: false, text: '' }
};

const store = createStore();

/* ---------------- small helpers ---------------- */
function loadDotEnv(file) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (e) { /* no .env file */ }
}

const str = (v, max = 200) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const words = t => (String(t).trim().match(/\S+/g) || []).length;

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket.remoteAddress || 'unknown';
}

const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter(t => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  return hits.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of buckets) if (!v.some(t => now - t < 3600e3)) buckets.delete(k); }, 600e3).unref();

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(data);
}

function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(Object.assign(new Error('Bad JSON'), { status: 400 })); } });
    req.on('error', reject);
  });
}

/* ---------------- admin sessions ---------------- */
const sign = v => crypto.createHmac('sha256', SESSION_SECRET).update(v).digest('base64url');
const sameText = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());

function makeSession(days) {
  const payload = Buffer.from(JSON.stringify({ e: ADMIN_EMAIL, x: Date.now() + days * 864e5 })).toString('base64url');
  return payload + '.' + sign(payload);
}
function readSession(req) {
  const m = String(req.headers.cookie || '').match(/(?:^|;\s*)bp_admin=([^;]+)/);
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig || !sameText(sig, sign(payload))) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return s.x > Date.now() && s.e === ADMIN_EMAIL ? s : null;
  } catch (e) { return null; }
}
function cookie(req, value, maxAgeSec) {
  const secure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? '; Secure' : '';
  return `bp_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`;
}

/* ---------------- enquiries ---------------- */
function newId() { return 'BP-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase(); }
const publicEnquiry = ({ token, ...rest }) => rest;
const money = v => Math.max(0, Math.min(1e10, Math.round(Number(v) || 0)));
const ymd = v => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '');

function validateEnquiry(b) {
  const name = str(b.name, 80);
  const phone = str(b.phone, 24);
  const email = str(b.email, 120);
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2) return 'Please add your name.';
  if (digits.length < 8 || digits.length > 15) return 'Please add a valid phone number.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please check your email address.';
  const services = [].concat(b.services || []).map(s => str(s, 40)).filter(s => SERVICES.includes(s));
  if (!services.length) return 'Please pick at least one service.';
  if (words(b.message || '') > 200) return 'Please keep the message under 150 words.';
  return null;
}

async function notify(subject, lines) {
  const key = process.env.RESEND_API_KEY, to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM || 'Bizparkers <onboarding@resend.dev>', to: [to], subject, text: lines.join('\n') })
    });
  } catch (e) { console.error('[bizparkers] email notification failed:', e.message); }
}

const siteSettings = async () => {
  const s = await store.getSettings();
  return { ...DEFAULT_SETTINGS, ...s, announcement: { ...DEFAULT_SETTINGS.announcement, ...(s.announcement || {}) } };
};

/* ---------------- API routes ---------------- */
async function api(req, res, url) {
  const ip = clientIp(req);
  const p = url.pathname;
  const m = req.method;

  // public
  if (p === '/api/config' && m === 'GET') {
    const s = await siteSettings();
    return send(res, 200, s, { 'Cache-Control': 'public, max-age=60' });
  }

  if (p === '/api/track' && m === 'POST') {
    if (limited('track:' + ip, 240, 60e3)) return send(res, 204, '');
    if (/bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(req.headers['user-agent'] || '')) return send(res, 204, '');
    const b = await readJson(req, 4096);
    const types = ['view', 'leave', 'cta', 'section', 'form_open', 'form_step', 'form_submit', 'form_details', 'scratch', 'outbound'];
    if (!types.includes(b.t)) return send(res, 204, '');
    const ev = {
      ts: new Date().toISOString(), t: b.t,
      sid: str(b.sid, 40), vid: str(b.vid, 40),
      path: str(b.path, 120), ref: str(b.ref, 120).toLowerCase(),
      utm: b.utm ? { s: str(b.utm.s, 60), m: str(b.utm.m, 60), c: str(b.utm.c, 80) } : undefined,
      dev: ['mobile', 'tablet', 'desktop'].includes(b.dev) ? b.dev : undefined,
      tz: str(b.tz, 60) || undefined,
      label: str(b.label, 60) || undefined,
      step: Number.isFinite(+b.step) ? +b.step : undefined,
      dur: Number.isFinite(+b.dur) ? Math.round(+b.dur) : undefined
    };
    if (!ev.sid || !ev.vid) return send(res, 204, '');
    await store.addEvent(ev);
    return send(res, 204, '');
  }

  if (p === '/api/enquiries' && m === 'POST') {
    if (limited('enq:' + ip, 6, 10 * 60e3)) return send(res, 429, { ok: false, error: 'Too many enquiries. Please try again in a few minutes.' });
    const b = await readJson(req);
    if (b.company_website) return send(res, 200, { ok: true, id: newId(), token: 'x' }); // honeypot: a bot
    const err = validateEnquiry(b);
    if (err) return send(res, 400, { ok: false, error: err });
    const now = new Date().toISOString();
    const e = {
      id: newId(), token: crypto.randomBytes(16).toString('hex'),
      createdAt: now, updatedAt: now, status: 'New', starred: false, value: 0, followUp: '', tags: [],
      name: str(b.name, 80), phone: str(b.phone, 24), email: str(b.email, 120),
      services: [].concat(b.services).map(s => str(s, 40)).filter(s => SERVICES.includes(s)),
      budget: str(b.budget, 60), message: str(b.message, 1500),
      brand: '', hasSite: '', website: '', adSpend: '', improve: [],
      source: {
        ref: str(b.source && b.source.ref, 120), landing: str(b.source && b.source.landing, 200),
        utm: str(b.source && b.source.utm, 120), dev: str(b.source && b.source.dev, 10)
      },
      sid: str(b.sid, 40), vid: str(b.vid, 40),
      activity: [{ ts: now, type: 'created', text: 'Enquiry received from the website' }]
    };
    await store.createEnquiry(e);
    notify(`New enquiry: ${e.name} (${e.services.join(', ')})`, [
      `Name: ${e.name}`, `Phone: ${e.phone}`, `Email: ${e.email || '-'}`, `Looking for: ${e.services.join(', ')}`,
      `Budget: ${e.budget || '-'}`, `About: ${e.message || '-'}`, '', `Open the admin panel to reply. ID ${e.id}`]);
    return send(res, 201, { ok: true, id: e.id, token: e.token });
  }

  const det = p.match(/^\/api\/enquiries\/([A-Z0-9-]{4,40})\/details$/);
  if (det && m === 'POST') {
    if (limited('det:' + ip, 12, 10 * 60e3)) return send(res, 429, { ok: false, error: 'Too many requests. Try again shortly.' });
    const b = await readJson(req);
    const e = await store.getEnquiry(det[1]);
    if (!e || !b.token || !sameText(b.token, e.token)) return send(res, 404, { ok: false, error: 'Enquiry not found.' });
    const email = str(b.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { ok: false, error: 'Please check your email address.' });
    Object.assign(e, {
      brand: str(b.brand, 100), email: email || e.email, hasSite: str(b.hasSite, 10), website: str(b.website, 200),
      adSpend: str(b.adSpend, 60), improve: [].concat(b.improve || []).map(x => str(x, 60)).slice(0, 15),
      updatedAt: new Date().toISOString()
    });
    e.activity.push({ ts: e.updatedAt, type: 'details', text: 'Customer added faster-reply details' });
    await store.saveEnquiry(e);
    notify(`More details: ${e.brand} (${e.name})`, [`Business: ${e.brand}`, `Email: ${e.email}`, `Website: ${e.website || e.hasSite}`,
      `Ad spend: ${e.adSpend}`, `Wants to improve: ${e.improve.join(', ')}`, '', `ID ${e.id}`]);
    return send(res, 200, { ok: true });
  }

  // admin auth
  if (p === '/api/admin/login' && m === 'POST') {
    if (limited('login:' + ip, 8, 15 * 60e3)) return send(res, 429, { ok: false, error: 'Too many attempts. Wait 15 minutes and try again.' });
    const b = await readJson(req, 4096);
    const ok = sameText(str(b.email, 120).toLowerCase(), ADMIN_EMAIL) & sameText(String(b.password || ''), ADMIN_PASSWORD);
    if (!ok) return send(res, 401, { ok: false, error: 'Wrong email or password.' });
    const days = b.remember ? 30 : 1;
    return send(res, 200, { ok: true, email: ADMIN_EMAIL }, { 'Set-Cookie': cookie(req, makeSession(days), days * 86400) });
  }
  if (p === '/api/admin/logout' && m === 'POST') return send(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, '', 0) });

  if (p.startsWith('/api/admin/')) {
    if (!readSession(req)) return send(res, 401, { ok: false, error: 'Please sign in.' });
    if (m !== 'GET' && req.headers['x-bp-admin'] !== '1') return send(res, 403, { ok: false, error: 'Forbidden' });

    if (p === '/api/admin/me' && m === 'GET') return send(res, 200, { ok: true, email: ADMIN_EMAIL, storage: store.kind });

    if (p === '/api/admin/stats' && m === 'GET') {
      const days = [7, 30, 90, 365].includes(+url.searchParams.get('days')) ? +url.searchParams.get('days') : 30;
      const since = new Date(Date.now() - (days * 2 + 1) * 864e5).toISOString();
      const [events, enquiries] = await Promise.all([store.eventsSince(since), store.listEnquiries()]);
      return send(res, 200, { ok: true, ...computeStats(events, enquiries, days) });
    }

    if (p === '/api/admin/enquiries' && m === 'GET') {
      const list = (await store.listEnquiries()).map(publicEnquiry);
      return send(res, 200, { ok: true, enquiries: list, statuses: STATUSES });
    }

    if (p === '/api/admin/enquiries' && m === 'POST') {
      const b = await readJson(req);
      const name = str(b.name, 80);
      if (name.length < 2) return send(res, 400, { ok: false, error: 'Add the client name.' });
      const status = STATUSES.includes(b.status) ? b.status : 'New';
      const now = new Date().toISOString();
      if (money(b.value) && money(b.paid) > money(b.value)) return send(res, 400, { ok: false, error: "Received can't be more than the amount." });
      const e = {
        id: newId(), token: crypto.randomBytes(16).toString('hex'),
        createdAt: now, updatedAt: now, status, starred: false,
        value: money(b.value), paid: money(b.paid), closedAt: status === 'Won' ? (ymd(b.closedAt) || now.slice(0, 10)) : '',
        followUp: ymd(b.followUp), tags: [].concat(b.tags || []).map(t => str(t, 30)).filter(Boolean).slice(0, 10),
        name, phone: str(b.phone, 24), email: str(b.email, 120),
        services: [].concat(b.services || []).map(s => str(s, 40)).filter(Boolean).slice(0, 10),
        budget: '', message: str(b.message, 1500), brand: str(b.brand, 100), hasSite: '', website: '', adSpend: '', improve: [],
        source: { ref: 'manual', landing: '', utm: '', dev: '' }, sid: '', vid: '',
        activity: [{ ts: now, type: 'created', text: status === 'Won' ? 'Sale added manually in the admin panel' : 'Added manually in the admin panel' }]
      };
      if (e.paid) e.activity.push({ ts: now, type: 'payment', text: `Payment received: ₹${e.paid.toLocaleString('en-IN')}` });
      await store.createEnquiry(e);
      return send(res, 201, { ok: true, enquiry: publicEnquiry(e) });
    }

    if (p === '/api/admin/enquiries.csv' && m === 'GET') {
      const list = await store.listEnquiries();
      const cols = [['ID', 'id'], ['Received', 'createdAt'], ['Status', 'status'], ['Name', 'name'], ['Phone', 'phone'], ['Email', 'email'],
        ['Looking for', 'services'], ['Budget', 'budget'], ['About', 'message'], ['Business', 'brand'], ['Website', 'website'],
        ['Ad spend', 'adSpend'], ['Wants to improve', 'improve'], ['Deal value', 'value'], ['Received', 'paid'], ['Closed on', 'closedAt'], ['Follow-up', 'followUp'], ['Tags', 'tags'], ['Source', 'source']];
      const cell = v => { let s = Array.isArray(v) ? v.join(', ') : v && typeof v === 'object' ? (v.utm || v.ref || '') : String(v ?? ''); if (/^[=+\-@]/.test(s) && !/^\+[\d\s()-]+$/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
      const csv = '﻿' + [cols.map(c => cell(c[0])).join(','), ...list.map(e => cols.map(c => cell(e[c[1]])).join(','))].join('\n');
      return send(res, 200, csv, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="bizparkers-enquiries-${new Date().toISOString().slice(0, 10)}.csv"` });
    }

    const one = p.match(/^\/api\/admin\/enquiries\/([A-Z0-9-]{4,40})$/);
    if (one && m === 'PATCH') {
      const e = await store.getEnquiry(one[1]);
      if (!e) return send(res, 404, { ok: false, error: 'Enquiry not found.' });
      const b = await readJson(req);
      const now = new Date().toISOString();
      if (b.status !== undefined && STATUSES.includes(b.status) && b.status !== e.status) {
        e.activity.push({ ts: now, type: 'status', text: `Status changed from ${e.status} to ${b.status}` });
        e.status = b.status;
        if (b.status === 'Won' && !e.closedAt) e.closedAt = now.slice(0, 10);
      }
      if (b.starred !== undefined) e.starred = !!b.starred;
      if (b.value !== undefined) e.value = money(b.value);
      const total = Number(e.value) || 0;
      if (b.paid !== undefined && total && money(b.paid) > total) return send(res, 400, { ok: false, error: `Received can't be more than the deal amount (₹${total.toLocaleString('en-IN')}).` });
      if (b.addPayment !== undefined && total && (Number(e.paid) || 0) + money(b.addPayment) > total) {
        return send(res, 400, { ok: false, error: `That's more than what's still due (₹${Math.max(0, total - (Number(e.paid) || 0)).toLocaleString('en-IN')}).` });
      }
      if (b.paid !== undefined) e.paid = money(b.paid);
      if (b.addPayment !== undefined && money(b.addPayment) > 0) {
        e.paid = (Number(e.paid) || 0) + money(b.addPayment);
        e.activity.push({ ts: now, type: 'payment', text: `Payment received: ₹${money(b.addPayment).toLocaleString('en-IN')}` });
      }
      if (b.closedAt !== undefined) e.closedAt = /^\d{4}-\d{2}-\d{2}$/.test(b.closedAt) ? b.closedAt : '';
      if (b.followUp !== undefined) e.followUp = /^\d{4}-\d{2}-\d{2}$/.test(b.followUp) ? b.followUp : '';
      if (b.tags !== undefined) e.tags = [].concat(b.tags).map(t => str(t, 30)).filter(Boolean).slice(0, 10);
      if (b.note) e.activity.push({ ts: now, type: 'note', text: str(b.note, 2000) });
      e.updatedAt = now;
      await store.saveEnquiry(e);
      return send(res, 200, { ok: true, enquiry: publicEnquiry(e) });
    }
    if (one && m === 'DELETE') {
      const ok = await store.deleteEnquiry(one[1]);
      return send(res, ok ? 200 : 404, { ok });
    }

    if (p === '/api/admin/settings' && m === 'GET') return send(res, 200, { ok: true, settings: await siteSettings() });
    if (p === '/api/admin/settings' && m === 'PUT') {
      const b = await readJson(req);
      const s = {
        email: str(b.email, 120), phone: str(b.phone, 30), instagram: str(b.instagram, 200),
        available: !!b.available,
        announcement: { on: !!(b.announcement && b.announcement.on), text: str(b.announcement && b.announcement.text, 160) }
      };
      if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) return send(res, 400, { ok: false, error: 'Check the email address.' });
      if (s.instagram && !/^https:\/\//.test(s.instagram)) return send(res, 400, { ok: false, error: 'The Instagram link must start with https://' });
      await store.saveSettings(s);
      return send(res, 200, { ok: true, settings: await siteSettings() });
    }
  }

  return send(res, 404, { ok: false, error: 'Not found' });
}

/* ---------------- static files (gzip/brotli, cached in memory) ---------------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json' };
const fileCache = new Map();

// Pages may contain %%SITE_URL%% (canonical, Open Graph, structured data); it becomes SITE_URL or the request's origin.
function loadFile(file, site) {
  const stat = fs.statSync(file);
  const key = file + '|' + (site || '');
  const hit = fileCache.get(key);
  if (hit && hit.mtime === stat.mtimeMs) return hit;
  let raw = fs.readFileSync(file);
  if (site && /\.html$/.test(file)) raw = Buffer.from(raw.toString('utf8').split('%%SITE_URL%%').join(site));
  const ext = path.extname(file);
  const text = /\.(html|css|js|json|svg|txt|xml)$/.test(ext);
  const entry = {
    mtime: stat.mtimeMs, raw, type: TYPES[ext] || 'application/octet-stream',
    etag: '"' + crypto.createHash('sha1').update(raw).digest('base64url').slice(0, 16) + '"',
    br: text ? zlib.brotliCompressSync(raw) : null,
    gz: text ? zlib.gzipSync(raw, { level: 9 }) : null
  };
  fileCache.set(key, entry);
  return entry;
}

function serveFile(req, res, file, cache, status = 200) {
  let f;
  const site = (process.env.SITE_URL || origin(req)).replace(/\/+$/, '');
  try { f = loadFile(file, site); } catch (e) { return send(res, 404, 'Not found'); }
  const headers = { 'Content-Type': f.type, 'Cache-Control': cache, ETag: f.etag, Vary: 'Accept-Encoding' };
  if (status === 200 && req.headers['if-none-match'] === f.etag) { res.writeHead(304, headers); return res.end(); }
  const ae = String(req.headers['accept-encoding'] || '');
  let body = f.raw;
  if (f.br && /\bbr\b/.test(ae)) { body = f.br; headers['Content-Encoding'] = 'br'; }
  else if (f.gz && /\bgzip\b/.test(ae)) { body = f.gz; headers['Content-Encoding'] = 'gzip'; }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/robots.txt') return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${(process.env.SITE_URL || origin(req)).replace(/\/+$/, '')}/sitemap.xml\n`, { 'Cache-Control': 'public, max-age=3600' });
  if (p === '/sitemap.xml') {
    const site = (process.env.SITE_URL || origin(req)).replace(/\/+$/, ''), day = new Date().toISOString().slice(0, 10);
    return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${site}/</loc><lastmod>${day}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n<url><loc>${site}/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>\n</urlset>\n`, { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' });
  }
  if (p === '/privacy' || p === '/privacy/') return serveFile(req, res, path.join(PUBLIC_DIR, 'privacy.html'), 'public, max-age=3600');
  if (p === '/admin') { res.writeHead(301, { Location: '/admin/' }); return res.end(); }
  if (p === '/' || p === '/index.html') return serveFile(req, res, path.join(PUBLIC_DIR, 'index.html'), 'no-cache');
  if (p === '/admin/') return serveFile(req, res, path.join(PUBLIC_DIR, 'admin', 'index.html'), 'no-store');
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return serveFile(req, res, path.join(PUBLIC_DIR, '404.html'), 'no-cache', 404);
  }
  return serveFile(req, res, file, p.startsWith('/assets/') ? 'public, max-age=604800' : 'no-cache');
}

function origin(req) {
  const proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}

/* ---------------- server ---------------- */
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/healthz') return send(res, 200, { ok: true, storage: store.kind });
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return serveStatic(req, res, url);
  } catch (e) {
    if (!e.status) console.error('[bizparkers]', req.method, url.pathname, e);
    if (!res.headersSent) send(res, e.status || 500, { ok: false, error: e.status ? e.message : 'Something went wrong. Please try again.' });
  }
});

store.init().then(async () => {
  const prune = () => store.pruneEvents(new Date(Date.now() - 400 * 864e5).toISOString()).catch(() => {});
  prune(); setInterval(prune, 24 * 3600e3).unref();
  server.listen(PORT, () => console.log(`[bizparkers] running on http://localhost:${PORT} (storage: ${store.kind}, admin: ${ADMIN_EMAIL})`));
}).catch(e => { console.error('[bizparkers] could not start storage:', e.message); process.exit(1); });

const stop = () => server.close(() => process.exit(0));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
