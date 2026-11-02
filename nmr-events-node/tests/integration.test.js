'use strict';
// End-to-end checks against a real PostgreSQL database. Skipped when DATABASE_URL is not set.
// Run `npx prisma migrate deploy` on that database first. Test rows use unique emails and are removed afterwards.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const enabled = Boolean(process.env.DATABASE_URL);
const KEY = 'test-operator-key-' + crypto.randomBytes(4).toString('hex');
process.env.ADMIN_API_KEY = KEY;
process.env.OTP_DEMO_MODE = 'true';
process.env.OTP_RESEND_SECONDS = '0';
process.env.OTP_MAX_ATTEMPTS = '3';
process.env.RATE_LIMIT_MULTIPLIER = '50'; // the rate limiter itself is checked by hand; do not let it block the suite
process.env.BASE_URL = 'http://localhost:3999';

const skip = enabled ? false : 'DATABASE_URL not set';
let server; let base; let prisma;
const emails = []; const eventIds = [];

test.before(async () => {
  if (!enabled) return;
  const { createApp } = require('../src/app');
  prisma = require('../src/db');
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (!enabled) return;
  await prisma.employee.deleteMany({ where: { email: { in: emails } } });
  await prisma.eventProject.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.$disconnect();
  await new Promise((r) => server.close(r));
});

const call = async (path, { method = 'GET', body, key } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(key ? { 'x-admin-key': key } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const newPerson = () => {
  const email = `it-${crypto.randomBytes(5).toString('hex')}@example.com`;
  emails.push(email);
  return { fullName: 'Test Person', dob: '1996-02-03', email, bio: 'Experienced event hostess.', experience: 'Five seasons of events.' };
};

test('full registration: pending -> wrong code -> right code -> badge + QR + public profile', { skip }, async () => {
  const p = newPerson();
  const reg = await call('/api/auth/register-employee', { method: 'POST', body: p });
  assert.equal(reg.status, 201);
  assert.match(reg.json.devOtp, /^\d{6}$/);

  const pending = await prisma.employee.findUnique({ where: { email: p.email }, include: { otp: true } });
  assert.equal(pending.verified, false);
  assert.equal(pending.uniqueTrackingId, null);
  assert.notEqual(pending.otp.codeHash, reg.json.devOtp); // only a hash is stored

  const wrong = await call('/api/auth/verify-otp', { method: 'POST', body: { email: p.email, otp: reg.json.devOtp === '000000' ? '111111' : '000000' } });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.json.error.attemptsLeft, 2);

  const ok = await call('/api/auth/verify-otp', { method: 'POST', body: { email: p.email, otp: reg.json.devOtp } });
  assert.equal(ok.status, 200);
  const id = ok.json.badge.uniqueId;
  assert.match(id, /^\d{22,24}$/);
  assert.equal(id.slice(4, 16), '127000000001'); // loopback client address

  const pub = await call(`/api/employee/${id}`);
  assert.equal(pub.status, 200);
  assert.equal(pub.json.employee.fullName, 'Test Person');
  assert.equal(pub.json.employee.dob, undefined); // minimal profile hides the date of birth
  assert.match(pub.json.employee.email, /^i\*+@example\.com$/);

  const img = await fetch(`${base}/qrcodes/${id}.png`);
  assert.equal(img.headers.get('content-type'), 'image/png');
  const page = await fetch(`${base}/badge/${id}`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Official crew badge/);

  const stored = await prisma.employee.findUnique({ where: { email: p.email }, include: { otp: true } });
  assert.equal(stored.verified, true);
  assert.equal(stored.otp, null); // the challenge is consumed
  assert.match(stored.clientIp, /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/);

  assert.equal((await call('/api/auth/register-employee', { method: 'POST', body: p })).status, 409);
  assert.equal((await call('/api/auth/verify-otp', { method: 'POST', body: { email: p.email, otp: reg.json.devOtp } })).status, 400);
});

test('otp locks after the maximum wrong attempts and expires', { skip }, async () => {
  const p = newPerson();
  const reg = await call('/api/auth/register-employee', { method: 'POST', body: p });
  const wrong = reg.json.devOtp === '000000' ? '111111' : '000000';
  for (let i = 0; i < 3; i += 1) assert.equal((await call('/api/auth/verify-otp', { method: 'POST', body: { email: p.email, otp: wrong } })).status, 400);
  const locked = await call('/api/auth/verify-otp', { method: 'POST', body: { email: p.email, otp: reg.json.devOtp } });
  assert.equal(locked.status, 429); // even the right code is refused once locked
  assert.equal(locked.json.error.code, 'OTP_LOCKED');

  const again = await call('/api/auth/resend-otp', { method: 'POST', body: { email: p.email } });
  assert.equal(again.status, 200);
  await prisma.otpChallenge.updateMany({ where: { employee: { email: p.email } }, data: { expiresAt: new Date(Date.now() - 1000) } });
  const late = await call('/api/auth/verify-otp', { method: 'POST', body: { email: p.email, otp: again.json.devOtp } });
  assert.equal(late.status, 400);
  assert.equal(late.json.error.code, 'INVALID_OTP');
});

test('smart id gets a sequence suffix only when the same second and address repeat', { skip }, async () => {
  const { nextSmartId, baseId } = require('../src/utils/smartId');
  const when = new Date('2031-06-15T10:20:30Z');
  const first = await nextSmartId('203.0.113.77', when);
  assert.equal(first, baseId(when, '203.0.113.77'));
  const p = newPerson();
  await prisma.employee.create({ data: { fullName: p.fullName, dob: new Date('1990-01-01'), email: p.email, bio: 'x', experience: 'y', verified: true, uniqueTrackingId: first } });
  assert.equal(await nextSmartId('203.0.113.77', when), `${first}01`);
  assert.equal(await nextSmartId('203.0.113.78', when).then((x) => x.length), 22);
});

test('malformed and hostile input is rejected cleanly', { skip }, async () => {
  const res = await fetch(`${base}/api/auth/register-employee`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad json' });
  assert.equal(res.status, 400);
  const big = await fetch(`${base}/api/auth/register-employee`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bio: 'x'.repeat(50_000) }) });
  assert.equal(big.status, 413);
  assert.equal((await call('/api/employee/abc')).status, 404);
  assert.equal((await call('/api/employee/' + '9'.repeat(22))).status, 404);
  assert.equal((await fetch(`${base}/badge/..%2f..%2fetc%2fpasswd`)).status, 404);
  assert.equal((await call('/api/compliance/calculate?area=abc&crowd=5')).status, 400);
  const sql = await call('/api/auth/verify-otp', { method: 'POST', body: { email: "x'; DROP TABLE \"Employee\";--@a.com", otp: '123456' } });
  assert.equal(sql.status, 400);
  const html = await call('/api/auth/register-employee', { method: 'POST', body: { ...newPerson(), fullName: '<script>alert(1)</script>' } });
  assert.equal(html.status, 201); // stored as text; every view escapes it
});

test('security headers: strict CSP with a nonce, no framing, no sniffing', { skip }, async () => {
  const res = await fetch(`${base}/booth`);
  const csp = res.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self' 'nonce-[\w+/=]+'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-powered-by'), null);
  const html = await res.text();
  const nonce = /content-security-policy/i.test(JSON.stringify([...res.headers])) && csp.match(/'nonce-([\w+/=]+)'/)[1];
  assert.ok(html.includes(`nonce="${nonce}"`), 'importmap carries the request nonce');
  const forged = await fetch(`${base}/`, { headers: { 'x-forwarded-for': '1.2.3.4' } });
  assert.equal(forged.status, 200);
});

test('operator endpoints require the key; occupancy updates are atomic', { skip }, async () => {
  assert.equal((await call('/api/event-projects')).status, 401);
  assert.equal((await call('/api/event-projects', { key: 'wrong' })).status, 401);

  const created = await call('/api/event-projects', {
    method: 'POST', key: KEY,
    body: { clientName: 'Integration Expo', spaceArea: 1000, duration: 2, venueType: 'INDOOR', eventType: 'exhibition', capacity: 400 },
  });
  assert.equal(created.status, 201);
  const id = created.json.project.id; eventIds.push(id);
  assert.equal(created.json.project.complianceStatus, 'COMPLIANT');

  const bad = await call('/api/event-projects', { method: 'POST', key: KEY, body: { clientName: 'x' } });
  assert.equal(bad.status, 400);

  await Promise.all(Array.from({ length: 25 }, () => call(`/api/crowd/${id}/occupancy`, { method: 'POST', key: KEY, body: { delta: 1 } })));
  const status = await call(`/api/crowd/${id}/status`, { key: KEY });
  assert.equal(status.json.currentOccupancy, 25); // no lost updates under concurrency
  assert.equal((await call(`/api/crowd/${id}/occupancy`, { method: 'POST', key: KEY, body: { delta: -1000 } })).json.currentOccupancy, 0); // never below zero
  const over = await call(`/api/crowd/${id}/occupancy`, { method: 'POST', key: KEY, body: { count: 450 } });
  assert.equal(over.json.level, 'over');

  const gen = await call(`/api/crowd/${id}/staff/generate`, { method: 'POST', key: KEY });
  assert.equal(gen.status, 201);
  const staff = await call(`/api/crowd/${id}/staff`, { key: KEY });
  assert.equal(staff.json.staff.length, gen.json.created);
  const one = staff.json.staff[0];
  const patched = await call(`/api/crowd/staff/${one.id}`, { method: 'PATCH', key: KEY, body: { status: 'ACTIVE' } });
  assert.equal(patched.json.staff.status, 'ACTIVE');
  assert.equal((await call(`/api/crowd/${id}/status`, { key: KEY })).json.staff.ACTIVE, 1);
  assert.equal((await call('/api/crowd/00000000-0000-0000-0000-000000000000/status', { key: KEY })).status, 404);
});

test('public api: portfolio filter, compliance, planner', { skip }, async () => {
  const all = await call('/api/projects');
  assert.ok(all.json.portfolio.length >= 6 && all.json.booths.length === 3);
  const ex = await call('/api/projects?category=exhibition');
  assert.ok(ex.json.portfolio.every((p) => p.category === 'exhibition'));
  const c = await call('/api/compliance/calculate?area=2000&crowd=900&venueType=OUTDOOR&eventType=entertainment');
  assert.equal(c.json.permits[0].authority, 'GEA');
  const v = await call('/api/compliance/validate', { method: 'POST', body: { area: 2000, crowd: 900, venueType: 'OUTDOOR', eventType: 'entertainment', done: ['gea_licence'] } });
  assert.equal(v.json.ready, false);
  assert.ok(v.json.missing.length > 0);
  const plan = await call('/api/crowd/plan?area=2000&crowd=900');
  assert.equal(plan.json.tree.role, 'EVENT_DIRECTOR');
  assert.equal((await fetch(`${base}/nope`)).status, 404);
  assert.equal((await call('/api/nope')).status, 404);
});
