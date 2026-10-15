'use strict';
/*
 * Bizparkers: website + admin panel in one small Node server.
 *   /          the website (public/index.html)
 *   /admin     the admin panel (public/admin/index.html)
 *   /api/...   enquiries, analytics, settings
 * Configure with environment variables (see .env.example).
 * On Netlify the same app runs as a function instead (netlify/functions/api.mjs).
 */
const http = require('node:http');
const { handle, ready, store, ADMIN_EMAIL } = require('./lib/app');

const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(handle);

ready().then(() => {
  server.listen(PORT, () => console.log(`[bizparkers] running on http://localhost:${PORT} (storage: ${store.kind}, admin: ${ADMIN_EMAIL})`));
}).catch(e => { console.error('[bizparkers] could not start storage:', e.message); process.exit(1); });

const stop = () => server.close(() => process.exit(0));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
