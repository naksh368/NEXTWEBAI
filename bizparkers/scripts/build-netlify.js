'use strict';
// Builds the static part of the site for Netlify into ./dist:
// copies ./public and fills in the site address used by Google and share previews.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'public');
const out = path.join(root, 'dist');
const site = (process.env.SITE_URL || process.env.URL || '').replace(/\/+$/, '');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });

for (const f of ['index.html', 'privacy.html', '404.html', 'admin/index.html']) {
  const p = path.join(out, f);
  if (fs.existsSync(p)) fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split('%%SITE_URL%%').join(site));
}

const day = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${site}/</loc><lastmod>${day}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
<url><loc>${site}/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
`);
console.log(`[bizparkers] static site built in dist/ for ${site || '(no SITE_URL yet)'}`);
