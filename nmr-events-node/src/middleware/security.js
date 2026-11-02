'use strict';
const crypto = require('node:crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { AppError } = require('../utils/errors');

/** A fresh nonce per request lets our own inline <script> tags run while CSP still blocks injected ones. */
const nonce = (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
};

const helmetMw = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'"], // inline style="" is used for progress bars only
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      ...(config.isProd ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: config.isProd ? undefined : false,
});

const limiter = (windowMin, max, code = 'RATE_LIMITED') =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit: max * config.rateMultiplier,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) =>
      next(new AppError(429, code, 'Too many requests, please try again later')),
  });

const limits = {
  global: limiter(15, 600),
  auth: limiter(15, 20), // registration, OTP verify and resend
  publicProfile: limiter(15, 120),
  calc: limiter(15, 300),
  admin: limiter(15, 600),
};

/**
 * Operator endpoints need the `x-admin-key` header. Both values are hashed first so the
 * comparison is constant time and length does not leak.
 */
function requireAdmin(req, res, next) {
  if (!config.adminApiKey) {
    return next(new AppError(503, 'ADMIN_DISABLED', 'Operator endpoints are disabled: ADMIN_API_KEY is not set'));
  }
  const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
  const given = req.get('x-admin-key') || '';
  if (!crypto.timingSafeEqual(sha(given), sha(config.adminApiKey))) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid operator key'));
  }
  next();
}

module.exports = { nonce, helmetMw, limits, requireAdmin };
