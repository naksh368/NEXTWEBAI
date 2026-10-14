'use strict';
/*
 * Storage for enquiries, analytics events and site settings.
 * - DATABASE_URL set  -> Postgres (recommended for production)
 * - otherwise         -> files in DATA_DIR (enquiries + settings in one JSON file,
 *                        analytics events appended to one NDJSON file per month)
 */
const fs = require('node:fs');
const path = require('node:path');

class FileStore {
  constructor(dir) {
    this.kind = 'file';
    this.dir = dir;
    this.file = path.join(dir, 'bizparkers.json');
    this.db = { enquiries: [], settings: {} };
  }

  async init() {
    fs.mkdirSync(this.dir, { recursive: true });
    try { Object.assign(this.db, JSON.parse(fs.readFileSync(this.file, 'utf8'))); } catch (e) { /* first run */ }
  }

  persist() {
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.db));
    fs.renameSync(tmp, this.file);
  }

  async createEnquiry(e) { this.db.enquiries.push(e); this.persist(); return e; }
  async getEnquiry(id) { return this.db.enquiries.find(x => x.id === id) || null; }
  async saveEnquiry(e) {
    const i = this.db.enquiries.findIndex(x => x.id === e.id);
    if (i < 0) return null;
    this.db.enquiries[i] = e; this.persist(); return e;
  }
  async deleteEnquiry(id) {
    const n = this.db.enquiries.length;
    this.db.enquiries = this.db.enquiries.filter(x => x.id !== id);
    if (n !== this.db.enquiries.length) { this.persist(); return true; }
    return false;
  }
  async listEnquiries() {
    return [...this.db.enquiries].sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));
  }

  monthFile(d) { return path.join(this.dir, `events-${d.toISOString().slice(0, 7)}.ndjson`); }
  async addEvent(ev) { fs.appendFile(this.monthFile(new Date(ev.ts)), JSON.stringify(ev) + '\n', () => {}); }
  async eventsSince(iso) {
    const since = new Date(iso), out = [];
    const files = fs.readdirSync(this.dir).filter(f => /^events-\d{4}-\d{2}\.ndjson$/.test(f))
      .filter(f => f.slice(7, 14) >= iso.slice(0, 7)).sort();
    for (const f of files) {
      for (const line of fs.readFileSync(path.join(this.dir, f), 'utf8').split('\n')) {
        if (!line) continue;
        try { const ev = JSON.parse(line); if (new Date(ev.ts) >= since) out.push(ev); } catch (e) { /* skip bad line */ }
      }
    }
    return out;
  }
  async pruneEvents(beforeIso) {
    const cut = beforeIso.slice(0, 7);
    for (const f of fs.readdirSync(this.dir)) {
      if (/^events-\d{4}-\d{2}\.ndjson$/.test(f) && f.slice(7, 14) < cut) fs.unlinkSync(path.join(this.dir, f));
    }
  }

  async getSettings() { return { ...this.db.settings }; }
  async saveSettings(s) { this.db.settings = s; this.persist(); return s; }
}

class PgStore {
  constructor(url) {
    this.kind = 'postgres';
    const { Pool } = require('pg');
    const u = new URL(url);
    const local = /^(localhost|127\.0\.0\.1|::1)$/.test(u.hostname) || u.searchParams.get('sslmode') === 'disable' || process.env.PGSSL === 'disable';
    u.searchParams.delete('sslmode');
    this.pool = new Pool({ connectionString: u.toString(), ssl: local ? false : { rejectUnauthorized: false }, max: 5 });
  }

  async init() {
    await this.pool.query(`
      create table if not exists bp_enquiries (id text primary key, created_at timestamptz not null, doc jsonb not null);
      create index if not exists bp_enquiries_created on bp_enquiries (created_at desc);
      create table if not exists bp_events (id bigserial primary key, ts timestamptz not null, doc jsonb not null);
      create index if not exists bp_events_ts on bp_events (ts);
      create table if not exists bp_settings (k text primary key, v jsonb not null);
    `);
  }

  async createEnquiry(e) {
    await this.pool.query('insert into bp_enquiries (id, created_at, doc) values ($1, $2, $3)', [e.id, e.createdAt, e]);
    return e;
  }
  async getEnquiry(id) {
    const r = await this.pool.query('select doc from bp_enquiries where id = $1', [id]);
    return r.rows[0] ? r.rows[0].doc : null;
  }
  async saveEnquiry(e) {
    const r = await this.pool.query('update bp_enquiries set doc = $2 where id = $1', [e.id, e]);
    return r.rowCount ? e : null;
  }
  async deleteEnquiry(id) {
    const r = await this.pool.query('delete from bp_enquiries where id = $1', [id]);
    return r.rowCount > 0;
  }
  async listEnquiries() {
    const r = await this.pool.query('select doc from bp_enquiries order by created_at desc');
    return r.rows.map(x => x.doc);
  }

  async addEvent(ev) { await this.pool.query('insert into bp_events (ts, doc) values ($1, $2)', [ev.ts, ev]); }
  async eventsSince(iso) {
    const r = await this.pool.query('select doc from bp_events where ts >= $1 order by ts', [iso]);
    return r.rows.map(x => x.doc);
  }
  async pruneEvents(beforeIso) { await this.pool.query('delete from bp_events where ts < $1', [beforeIso]); }

  async getSettings() {
    const r = await this.pool.query("select v from bp_settings where k = 'site'");
    return r.rows[0] ? r.rows[0].v : {};
  }
  async saveSettings(s) {
    await this.pool.query("insert into bp_settings (k, v) values ('site', $1) on conflict (k) do update set v = excluded.v", [s]);
    return s;
  }
}

function createStore() {
  return process.env.DATABASE_URL
    ? new PgStore(process.env.DATABASE_URL)
    : new FileStore(path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data')));
}

module.exports = { createStore };
