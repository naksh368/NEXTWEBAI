'use strict';
/* Turns raw analytics events + enquiries into the numbers the admin dashboard shows. */

const TZ = process.env.TIMEZONE || 'Asia/Kolkata';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayKey = d => dayFmt.format(new Date(d));

function dayKeys(days, endOffset = 0, now = new Date()) {
  const keys = [];
  for (let i = days - 1 + endOffset; i >= endOffset; i--) keys.push(dayKey(now.getTime() - i * 864e5));
  return keys;
}

function source(ev) {
  if (ev.utm && ev.utm.s) return ev.utm.s.charAt(0).toUpperCase() + ev.utm.s.slice(1);
  const h = String(ev.ref || '').toLowerCase();
  if (!h) return 'Direct';
  if (/(^|\.)google\./.test(h)) return 'Google';
  if (/instagram/.test(h)) return 'Instagram';
  if (/facebook|fb\.com|fb\.me/.test(h)) return 'Facebook';
  if (/linkedin|lnkd\.in/.test(h)) return 'LinkedIn';
  if (/whatsapp|wa\.me/.test(h)) return 'WhatsApp';
  if (/(^|\.)bing\./.test(h)) return 'Bing';
  if (/(^|\.)t\.co$|twitter|(^|\.)x\.com/.test(h)) return 'X';
  if (/youtube|youtu\.be/.test(h)) return 'YouTube';
  return h.replace(/^www\./, '');
}

const place = tz => (tz ? String(tz).split('/').pop().replace(/_/g, ' ') : 'Unknown');

function countBy(items, fn) {
  const m = new Map();
  for (const it of items) {
    const keys = [].concat(fn(it)).filter(Boolean);
    for (const k of keys) m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function summarize(events, enquiries) {
  const views = events.filter(e => e.t === 'view');
  const visitors = new Set(views.map(e => e.vid)).size;
  const sessions = new Set(views.map(e => e.sid)).size;
  const durs = new Map();
  for (const e of events) if (e.t === 'leave' && e.dur > 0) durs.set(e.sid, Math.max(durs.get(e.sid) || 0, Math.min(e.dur, 3600)));
  const avgTime = durs.size ? Math.round([...durs.values()].reduce((a, b) => a + b, 0) / durs.size) : 0;
  return {
    visitors, sessions, views: views.length,
    enquiries: enquiries.length,
    conversion: visitors ? enquiries.length / visitors : 0,
    avgTime
  };
}

function computeStats(allEvents, allEnquiries, days, now = new Date()) {
  const cur = new Set(dayKeys(days, 0, now));
  const prev = new Set(dayKeys(days, days, now));
  const inCur = x => cur.has(dayKey(x));
  const inPrev = x => prev.has(dayKey(x));

  const ev = allEvents.filter(e => inCur(e.ts));
  const evPrev = allEvents.filter(e => inPrev(e.ts));
  const enq = allEnquiries.filter(e => inCur(e.createdAt) && e.status !== 'Spam');
  const enqPrev = allEnquiries.filter(e => inPrev(e.createdAt) && e.status !== 'Spam');

  // daily series
  const byDay = new Map([...cur].map(k => [k, { date: k, visitors: new Set(), views: 0, enquiries: 0 }]));
  for (const e of ev) if (e.t === 'view') { const d = byDay.get(dayKey(e.ts)); if (d) { d.views++; d.visitors.add(e.vid); } }
  for (const e of enq) { const d = byDay.get(dayKey(e.createdAt)); if (d) d.enquiries++; }
  const daily = [...byDay.values()].map(d => ({ date: d.date, visitors: d.visitors.size, views: d.views, enquiries: d.enquiries }));

  // one record per session (first page view) for sources, devices, places
  const firstView = new Map();
  for (const e of ev) if (e.t === 'view' && !firstView.has(e.sid)) firstView.set(e.sid, e);
  const sessionsList = [...firstView.values()];
  const nSessions = sessionsList.length || 1;

  // which sessions reached each step of the enquiry form
  const reached = (pred) => new Set(ev.filter(pred).map(e => e.sid)).size;
  const funnel = [
    { label: 'Opened the form', value: reached(e => e.t === 'form_open') },
    { label: 'Entered name', value: reached(e => e.t === 'form_step' && e.step >= 2) },
    { label: 'Entered phone', value: reached(e => e.t === 'form_step' && e.step >= 3) },
    { label: 'Picked services', value: reached(e => e.t === 'form_step' && e.step >= 4) },
    { label: 'Sent enquiry', value: reached(e => e.t === 'form_submit') },
    { label: 'Added faster-reply details', value: reached(e => e.t === 'form_details') }
  ];

  const sectionNames = { reveal: 'Scratch card', services: 'Services', work: 'What we can build', why: 'Why us', process: 'Process', bundles: 'Packages', faq: 'FAQ', contact: 'Contact' };
  const sections = Object.entries(sectionNames).map(([id, label]) => ({
    label, value: Math.round(reached(e => e.t === 'section' && e.label === id) / nSessions * 100)
  }));

  const open = allEnquiries.filter(e => !['Won', 'Lost', 'Spam'].includes(e.status));
  const today = dayKey(now);
  const statuses = ['New', 'Contacted', 'Proposal sent', 'Won', 'Lost'];

  return {
    range: days,
    timezone: TZ,
    kpis: { current: summarize(ev, enq), previous: summarize(evPrev, enqPrev) },
    daily,
    sources: countBy(sessionsList, source),
    devices: countBy(sessionsList, e => ({ mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }[e.dev] || 'Desktop')),
    places: countBy(sessionsList, e => place(e.tz)).slice(0, 8),
    sections,
    ctas: countBy(ev.filter(e => e.t === 'cta'), e => e.label).slice(0, 8),
    funnel,
    services: countBy(enq, e => e.services || []),
    budgets: countBy(enq, e => e.budget || 'Not shared'),
    pipeline: statuses.map(s => {
      const list = allEnquiries.filter(e => e.status === s);
      return { label: s, value: list.length, amount: list.reduce((a, e) => a + (Number(e.value) || 0), 0) };
    }),
    openValue: open.reduce((a, e) => a + (Number(e.value) || 0), 0),
    followUpsDue: open.filter(e => e.followUp && e.followUp <= today).length,
    live: new Set(allEvents.filter(e => now - new Date(e.ts) < 5 * 60e3).map(e => e.sid)).size
  };
}

module.exports = { computeStats, dayKey };
