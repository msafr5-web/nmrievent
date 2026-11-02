'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ipToDigits } = require('../src/utils/ip');
const { baseId } = require('../src/utils/smartId');
const { calculateCompliance, validateChecklist, exitsFor } = require('../src/utils/compliance');
const { buildStaffingTree, occupancyLevel } = require('../src/utils/crowd');
const v = require('../src/utils/validate');
const { generateOtp, hashOtp, checkOtp } = require('../src/utils/otp');
const { publicProfile } = require('../src/utils/profile');

test('smart id reproduces the example from the brief exactly', () => {
  // 12 April, 14:45:26 Riyadh time = 11:45:26 UTC, client 111.121.134.9
  const id = baseId(new Date('2026-04-12T11:45:26Z'), '111.121.134.9');
  assert.equal(id, '1204111121134009144526');
  assert.equal(id.length, 22);
});

test('smart id uses Riyadh time across midnight', () => {
  // 21:30 UTC on 31 Dec is already 00:30 on 1 Jan in Riyadh
  assert.equal(baseId(new Date('2026-12-31T21:30:05Z'), '10.0.0.7'), '0101010000000007003005');
});

test('ip to digits: IPv4, mapped IPv6, loopback, real IPv6', () => {
  assert.equal(ipToDigits('111.121.134.9'), '111121134009');
  assert.equal(ipToDigits('::ffff:10.0.0.7'), '010000000007');
  assert.equal(ipToDigits('::1'), '127000000001');
  const a = ipToDigits('2001:db8::1');
  assert.match(a, /^\d{12}$/);
  assert.equal(a, ipToDigits('2001:db8::1')); // deterministic
  assert.notEqual(a, ipToDigits('2001:db8::2'));
  assert.match(ipToDigits('999.1.1.1'), /^\d{12}$/); // invalid octet falls back to the hash form
  assert.match(ipToDigits(undefined), /^\d{12}$/);
});

test('compliance: capacity at the three densities', () => {
  const r = calculateCompliance({ area: 1200, crowd: 400, venueType: 'INDOOR', eventType: 'exhibition', density: 2, duration: 1 });
  assert.deepEqual([r.capacity.dense, r.capacity.standard, r.capacity.comfortable], [800, 600, 480]);
  assert.equal(r.status, 'COMPLIANT');
  assert.equal(r.density.band, 'comfortable');
});

test('compliance: status levels', () => {
  const base = { area: 1000, venueType: 'INDOOR', eventType: 'exhibition', density: 2, duration: 1 };
  assert.equal(calculateCompliance({ ...base, crowd: 500 }).status, 'COMPLIANT');
  assert.equal(calculateCompliance({ ...base, crowd: 600 }).status, 'CONDITIONAL'); // over 2.0 but within 1.5
  assert.equal(calculateCompliance({ ...base, crowd: 667 }).status, 'NON_COMPLIANT'); // above 1000/1.5
});

test('compliance: exits grow with the occupant load', () => {
  assert.equal(exitsFor(500), 2);
  assert.equal(exitsFor(501), 3);
  assert.equal(exitsFor(1000), 3);
  assert.equal(exitsFor(1001), 4);
});

test('compliance: permits depend on the event type and site', () => {
  const auth = (r) => r.permits.map((p) => p.authority);
  const mk = (eventType, venueType = 'INDOOR') => calculateCompliance({ area: 2000, crowd: 600, venueType, eventType, density: 2, duration: 1 });
  assert.deepEqual(auth(mk('exhibition')), ['SECA', 'CIVIL_DEFENSE']);
  assert.deepEqual(auth(mk('entertainment')), ['GEA', 'CIVIL_DEFENSE']);
  const outdoor = mk('exhibition', 'OUTDOOR');
  assert.ok(outdoor.outdoor && outdoor.outdoor.waterPoints >= 1);
  assert.equal(outdoor.fire.sprinklers, false);
  assert.ok(outdoor.permits.at(-1).items.some((i) => i.id === 'cd_outdoor_weather'));
});

test('checklist validation reports progress, missing and unknown ids', () => {
  const input = { area: 600, crowd: 200, venueType: 'INDOOR', eventType: 'exhibition', density: 2, duration: 1 };
  const none = validateChecklist(input, []);
  assert.equal(none.ready, false);
  assert.equal(none.progress.completed, 0);
  const all = validateChecklist(input, none.missing.map((m) => m.id).concat(['made_up']));
  assert.equal(all.ready, true);
  assert.equal(all.progress.percent, 100);
  assert.deepEqual(all.unknown, ['made_up']);
});

test('crowd: staffing tree adds up and scales', () => {
  const t = buildStaffingTree({ area: 1200, crowd: 800, venueType: 'INDOOR' });
  const sum = t.flat.reduce((n, x) => n + x.count, 0);
  assert.equal(sum, t.totals.all);
  assert.equal(t.tree.children.length, t.zones);
  const big = buildStaffingTree({ area: 50000, crowd: 20000, venueType: 'OUTDOOR' });
  assert.ok(big.zones > t.zones && big.totals.all > t.totals.all);
  assert.ok(t.totals.firstAid >= 2);
});

test('crowd: occupancy levels', () => {
  assert.equal(occupancyLevel(10, 100).level, 'normal');
  assert.equal(occupancyLevel(70, 100).level, 'busy');
  assert.equal(occupancyLevel(95, 100).level, 'near');
  assert.equal(occupancyLevel(101, 100).level, 'over');
  assert.equal(occupancyLevel(5, 0).level, 'unknown');
});

test('validation: registration rules', () => {
  const good = { fullName: ' Sara  ', dob: '1998-05-17', email: 'SARA@Example.com', bio: 'Ten characters or more', experience: 'Two seasons' };
  const ok = v.parse(v.registerSchema, good);
  assert.equal(ok.email, 'sara@example.com');
  assert.equal(ok.fullName, 'Sara');
  for (const bad of [{ dob: '2015-01-01' }, { dob: '1998-13-45' }, { dob: '17/05/1998' }, { email: 'nope' }, { fullName: 'x' }, { bio: 'short' }]) {
    assert.throws(() => v.parse(v.registerSchema, { ...good, ...bad }), (e) => e.status === 400 && e.code === 'VALIDATION_ERROR');
  }
});

test('validation: calculator input is bounded and coerced', () => {
  const r = v.parse(v.calcSchema, { area: '1000', crowd: '300' });
  assert.deepEqual([r.area, r.crowd, r.venueType, r.density], [1000, 300, 'INDOOR', 2]);
  assert.throws(() => v.parse(v.calcSchema, { area: '1000', crowd: '-5' }));
  assert.throws(() => v.parse(v.calcSchema, { area: '1000', crowd: '5', density: '9' }));
  assert.throws(() => v.parse(v.occupancySchema, { count: 5, delta: 1 })); // exactly one of the two
});

test('otp: 6 digits, hashed, verifiable', async () => {
  for (let i = 0; i < 200; i += 1) assert.match(generateOtp(), /^\d{6}$/);
  const h = await hashOtp('123456');
  assert.notEqual(h, '123456');
  assert.equal(await checkOtp('123456', h), true);
  assert.equal(await checkOtp('654321', h), false);
});

test('public profile hides date of birth in minimal mode', () => {
  const emp = { uniqueTrackingId: '1', fullName: 'A', verified: true, verifiedAt: new Date(), experience: 'e', bio: 'b', qrCodeUrl: '/q.png', email: 'sara@example.com', dob: new Date('1998-05-17') };
  const min = publicProfile(emp, 'minimal');
  assert.equal(min.dob, undefined);
  assert.equal(min.email, 's***@example.com');
  const full = publicProfile(emp, 'full');
  assert.equal(full.dob, '1998-05-17');
  assert.equal(full.email, 'sara@example.com');
});
