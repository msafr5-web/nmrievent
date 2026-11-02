'use strict';
const prisma = require('../db');
const config = require('../config');
const { ipToDigits } = require('./ip');

/**
 * Smart tracking ID = DDMM + IP(12 digits) + HHMMSS, in Saudi time (Asia/Riyadh).
 *
 *   1204 | 111121134009 | 144526   ->  1204111121134009144526
 *   date | 111.121.134.9 | 14:45:26
 *
 * This reproduces the example in the brief digit for digit (22 digits).
 * Sequence: the brief lists a sequence part, but its example has none. To keep IDs identical to
 * the example, a 2-digit sequence (01, 02, ...) is appended ONLY when the same date, IP and
 * second were already issued, which keeps every ID unique.
 */
function baseId(date, ip, timeZone = config.timezone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.day}${p.month}${ipToDigits(ip)}${p.hour}${p.minute}${p.second}`;
}

/** Returns an unused ID. The DB unique constraint is the final guard against a concurrent clash. */
async function nextSmartId(ip, date = new Date()) {
  const base = baseId(date, ip);
  const used = await prisma.employee.count({ where: { uniqueTrackingId: { startsWith: base } } });
  return used === 0 ? base : `${base}${String(used).padStart(2, '0')}`;
}

module.exports = { baseId, nextSmartId };
