/**
 * Bizparkers enquiries backend (Google Apps Script).
 * Stores website enquiries in a Google Sheet and serves the admin panel.
 *
 * Script properties (Project Settings -> Script properties):
 *   ADMIN_KEY     password for the admin panel (required)
 *   NOTIFY_EMAIL  email that gets a message for every new enquiry (optional)
 */
const SHEET_NAME = 'Enquiries';
const COLUMNS = ['Enquiry ID', 'Received', 'Status', 'Name', 'Phone', 'Email', 'Looking for', 'Budget',
  'About the business', 'Business name', 'Has a website', 'Website', 'Monthly ad spend', 'Wants to improve',
  'Notes', 'Updated'];
const PUBLIC_FIELDS = ['Name', 'Phone', 'Email', 'Looking for', 'Budget', 'About the business',
  'Business name', 'Has a website', 'Website', 'Monthly ad spend', 'Wants to improve'];
const STATUSES = ['New', 'Contacted', 'Proposal sent', 'Won', 'Lost'];

function doGet() {
  return json_({ ok: true, service: 'bizparkers-enquiries' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Bad request' }); }
  if (body._hp) return json_({ ok: true }); // honeypot filled in: a bot

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    switch (body.action) {
      case 'create': return json_(create_(body));
      case 'details': return json_(details_(body));
      case 'list': return json_(auth_(body) ? list_() : { ok: false, error: 'Wrong password' });
      case 'update': return json_(auth_(body) ? update_(body) : { ok: false, error: 'Wrong password' });
      default: return json_({ ok: false, error: 'Unknown action' });
    }
  } finally {
    lock.releaseLock();
  }
}

function create_(b) {
  const sh = sheet_();
  const id = clean_(b['Enquiry ID']) || 'BP-' + Date.now().toString(36).toUpperCase();
  if (findRow_(sh, id)) return { ok: true, id: id }; // already saved (double click)
  const now = new Date();
  const row = COLUMNS.map(c => {
    if (c === 'Enquiry ID') return id;
    if (c === 'Received') return now;
    if (c === 'Status') return 'New';
    if (c === 'Updated') return now;
    return PUBLIC_FIELDS.indexOf(c) > -1 ? clean_(b[c]) : '';
  });
  sh.appendRow(row);
  notify_('New enquiry: ' + clean_(b['Name']) + ' (' + clean_(b['Looking for']) + ')', b);
  return { ok: true, id: id };
}

function details_(b) {
  const sh = sheet_();
  const r = findRow_(sh, clean_(b['Enquiry ID']));
  if (!r) return create_(b);
  ['Business name', 'Email', 'Has a website', 'Website', 'Monthly ad spend', 'Wants to improve'].forEach(c => {
    const v = clean_(b[c]);
    if (v) sh.getRange(r, COLUMNS.indexOf(c) + 1).setValue(v);
  });
  sh.getRange(r, COLUMNS.indexOf('Updated') + 1).setValue(new Date());
  notify_('More details: ' + clean_(b['Business name']) + ' (' + clean_(b['Name']) + ')', b);
  return { ok: true };
}

function list_() {
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  const head = values.shift();
  const rows = values.filter(v => v[0]).map(v => {
    const o = {};
    head.forEach((h, i) => { o[h] = v[i] instanceof Date ? v[i].toISOString() : v[i]; });
    return o;
  });
  return { ok: true, rows: rows, statuses: STATUSES };
}

function update_(b) {
  const sh = sheet_();
  const r = findRow_(sh, clean_(b.id));
  if (!r) return { ok: false, error: 'Enquiry not found' };
  if (b.status && STATUSES.indexOf(b.status) > -1) sh.getRange(r, COLUMNS.indexOf('Status') + 1).setValue(b.status);
  if (typeof b.notes === 'string') sh.getRange(r, COLUMNS.indexOf('Notes') + 1).setValue(clean_(b.notes, 3000));
  sh.getRange(r, COLUMNS.indexOf('Updated') + 1).setValue(new Date());
  return { ok: true };
}

/* ---------- helpers ---------- */
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLUMNS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sh;
}

function findRow_(sh, id) {
  if (!id) return 0;
  const ids = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
  for (let i = ids.length - 1; i >= 1; i--) if (String(ids[i][0]) === id) return i + 1;
  return 0;
}

function auth_(b) {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  return !!key && b.key === key;
}

// Trim, cap length, and stop spreadsheet formulas from being injected.
function clean_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max || 1500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function notify_(subject, b) {
  const to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
  if (!to) return;
  const lines = PUBLIC_FIELDS.filter(f => b[f]).map(f => f + ': ' + clean_(b[f]));
  MailApp.sendEmail(to, '[Bizparkers] ' + subject, lines.join('\n') + '\n\nEnquiry ID: ' + clean_(b['Enquiry ID']));
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
