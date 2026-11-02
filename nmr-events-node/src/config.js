'use strict';
// Central, validated configuration. Everything else reads settings from here, never from process.env.
require('dotenv').config({ quiet: true });

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

function int(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Invalid ${name}: expected an integer between ${min} and ${max}`);
  }
  return n;
}

function trustProxy(raw) {
  if (raw === undefined || raw === '' || raw === '0' || raw === 'false') return false;
  if (raw === 'true') return true;
  return /^\d+$/.test(raw) ? Number(raw) : raw; // hop count or a subnet list
}

const port = int('PORT', 3000, { min: 1, max: 65535 });
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, '');
const otpDemo = process.env.OTP_DEMO_MODE === 'true';
const profileMode = process.env.PUBLIC_PROFILE_MODE === 'full' ? 'full' : 'minimal';

if (isProd) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
  if (!process.env.BASE_URL) throw new Error('BASE_URL is required in production (it is embedded in QR codes)');
  if (otpDemo) throw new Error('OTP_DEMO_MODE must be false in production: it would return the code to the caller');
}

module.exports = {
  env,
  isProd,
  port,
  baseUrl,
  trustProxy: trustProxy(process.env.TRUST_PROXY),
  rateMultiplier: int('RATE_LIMIT_MULTIPLIER', 1, { min: 1, max: 1000 }), // tests raise it; keep 1 in production
  adminApiKey: process.env.ADMIN_API_KEY || '',
  profileMode,
  timezone: 'Asia/Riyadh',
  otp: {
    demo: otpDemo,
    ttlMs: int('OTP_TTL_MINUTES', 10, { min: 1, max: 60 }) * 60 * 1000,
    maxAttempts: int('OTP_MAX_ATTEMPTS', 5, { min: 1, max: 10 }),
    resendMs: int('OTP_RESEND_SECONDS', 30, { min: 0, max: 600 }) * 1000,
  },
  smtp: process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: int('SMTP_PORT', 587, { min: 1, max: 65535 }),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'NMR Events <no-reply@localhost>',
      }
    : null,
};
