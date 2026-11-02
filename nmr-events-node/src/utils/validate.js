'use strict';
const { z } = require('zod');
const { AppError } = require('./errors');

// Strip control characters and collapse whitespace so stored text is clean and single-line safe.
const clean = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
const text = (min, max) =>
  z.string().transform(clean).pipe(z.string().min(min).max(max));

const ageOn = (iso, now = new Date()) => {
  const d = new Date(`${iso}T00:00:00Z`);
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
};

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Invalid date')
  .refine((s) => { const a = ageOn(s); return a >= 16 && a <= 80; }, 'Age must be between 16 and 80');

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());

const registerSchema = z.object({
  fullName: text(2, 100),
  dob: isoDate,
  email,
  bio: text(10, 1000),
  experience: text(2, 1000),
});

const verifySchema = z.object({
  email,
  otp: z.string().trim().regex(/^\d{6}$/, 'The code is 6 digits'),
});

const resendSchema = z.object({ email });

const venueType = z.enum(['INDOOR', 'OUTDOOR']);
const eventType = z.enum(['exhibition', 'conference', 'entertainment', 'corporate']);

// Query strings arrive as text, so numbers are coerced.
const calcSchema = z.object({
  area: z.coerce.number().min(10).max(5_000_000),
  crowd: z.coerce.number().int().min(1).max(1_000_000),
  venueType: venueType.default('INDOOR'),
  eventType: eventType.default('exhibition'),
  density: z.coerce.number().min(1.5).max(2.5).default(2),
  duration: z.coerce.number().int().min(1).max(365).default(1),
});

const validateChecklistSchema = calcSchema.extend({
  done: z.array(z.string().max(64)).max(100).default([]),
});

const eventProjectSchema = z.object({
  clientName: text(2, 120),
  spaceArea: z.coerce.number().min(10).max(5_000_000),
  duration: z.coerce.number().int().min(1).max(365),
  venueType,
  eventType: eventType.default('exhibition'),
  capacity: z.coerce.number().int().min(1).max(1_000_000),
  density: z.coerce.number().min(1.5).max(2.5).default(2),
});

const occupancySchema = z
  .object({
    count: z.coerce.number().int().min(0).max(2_000_000).optional(),
    delta: z.coerce.number().int().min(-100000).max(100000).optional(),
  })
  .refine((v) => (v.count === undefined) !== (v.delta === undefined), 'Send either count or delta');

const staffStatusSchema = z.object({ status: z.enum(['PLANNED', 'ACTIVE', 'ON_BREAK', 'OFF_DUTY']) });

/** Parses `data` with `schema`, throwing a 400 AppError that lists every invalid field. */
function parse(schema, data) {
  const r = schema.safeParse(data ?? {});
  if (r.success) return r.data;
  const fields = {};
  for (const issue of r.error.issues) fields[issue.path.join('.') || '_'] = issue.message;
  throw new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', { fields });
}

module.exports = {
  parse, registerSchema, verifySchema, resendSchema, calcSchema, validateChecklistSchema,
  eventProjectSchema, occupancySchema, staffStatusSchema, ageOn,
};
