'use strict';
const config = require('../config');
const { AppError } = require('../utils/errors');

const notFound = (req, res, next) => next(new AppError(404, 'NOT_FOUND', 'Not found'));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err instanceof AppError ? err.message : 'Something went wrong';
  let extra = err.extra || {};

  if (err.type === 'entity.parse.failed') { status = 400; code = 'BAD_JSON'; message = 'Malformed JSON body'; }
  else if (err.type === 'entity.too.large') { status = 413; code = 'TOO_LARGE'; message = 'Request body too large'; }
  else if (err.code === 'P2002') { status = 409; code = 'CONFLICT'; message = 'This record already exists'; extra = {}; }

  if (status >= 500) console.error(`[error] ${req.id} ${req.method} ${req.originalUrl}`, err);

  res.status(status);
  if (req.originalUrl.startsWith('/api/')) {
    return res.json({ error: { code, message, ...extra, ...(status >= 500 ? { requestId: req.id } : {}), ...(config.isProd ? {} : status >= 500 ? { stack: err.stack } : {}) } });
  }
  return res.render('error', { status, message, title: `${status}` });
}

module.exports = { notFound, errorHandler };
