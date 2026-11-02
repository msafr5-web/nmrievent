'use strict';
const crypto = require('node:crypto');

/**
 * Turns any client address into exactly 12 digits (4 octets x 3 digits, zero padded):
 *   111.121.134.9        -> 111121134009
 *   ::ffff:10.0.0.7      -> 010000000007   (IPv4-mapped IPv6 is unwrapped)
 *   ::1                  -> 127000000001   (loopback)
 * A real IPv6 address has no 4-octet form, so it is mapped deterministically to 12 digits
 * from its SHA-256 hash. The same address always yields the same digits.
 */
function ipToDigits(raw) {
  let ip = String(raw ?? '').trim();
  if (ip.startsWith('::ffff:') && ip.includes('.')) ip = ip.slice(7);
  if (ip === '::1') ip = '127.0.0.1';

  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (m && m.slice(1).every((o) => Number(o) <= 255)) {
    return m.slice(1).map((o) => o.padStart(3, '0')).join('');
  }

  const digest = crypto.createHash('sha256').update(ip || 'unknown').digest();
  return (digest.readBigUInt64BE(0) % 1_000_000_000_000n).toString().padStart(12, '0');
}

/** The client address as Express resolved it (honours the `trust proxy` setting). */
const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

module.exports = { ipToDigits, clientIp };
