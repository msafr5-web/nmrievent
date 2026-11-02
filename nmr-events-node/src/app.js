'use strict';
const path = require('node:path');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const { nonce, helmetMw, limits } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  // A request id ties a user-visible error to the server log line without exposing internals.
  app.use((req, res, next) => { req.id = uuidv4(); res.setHeader('X-Request-Id', req.id); next(); });
  app.use(nonce);
  app.use(helmetMw);

  const pub = path.join(__dirname, '..', 'public');
  const nm = path.join(__dirname, '..', 'node_modules');
  const week = config.isProd ? '7d' : 0;
  app.use(express.static(pub, { maxAge: week, index: false }));
  // Three.js is served from our own origin, so the strict CSP does not need a CDN.
  app.use('/vendor/three', express.static(path.join(nm, 'three', 'build'), { maxAge: week }));
  app.use('/vendor/three-addons', express.static(path.join(nm, 'three', 'examples', 'jsm'), { maxAge: week }));

  // Rate limits apply to dynamic routes only, so loading a page's assets never counts against the budget.
  app.use(limits.global);
  app.use(express.json({ limit: '20kb' }));

  app.get('/healthz', (req, res) => res.json({ ok: true }));
  app.use('/api', require('./routes/api'));
  app.use('/', require('./routes/pages'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };

if (require.main === module) {
  const prisma = require('./db');
  const server = createApp().listen(config.port, () => {
    console.log(`NMR Events running at ${config.baseUrl} (${config.env})`);
  });
  const stop = () => server.close(() => prisma.$disconnect().finally(() => process.exit(0)));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
