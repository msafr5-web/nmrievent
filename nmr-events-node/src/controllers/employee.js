'use strict';
const prisma = require('../db');
const config = require('../config');
const { AppError } = require('../utils/errors');
const { parse, registerSchema, verifySchema, resendSchema } = require('../utils/validate');
const { generateOtp, hashOtp, checkOtp } = require('../utils/otp');
const { sendOtp } = require('../utils/mailer');
const { nextSmartId } = require('../utils/smartId');
const { createBadgeQr } = require('../utils/qr');
const { clientIp } = require('../utils/ip');
const { publicProfile } = require('../utils/profile');

const ttlMinutes = Math.round(config.otp.ttlMs / 60000);

/** Creates a fresh OTP for the employee, stores only its hash, and "sends" it. */
async function issueOtp(employee) {
  const existing = await prisma.otpChallenge.findUnique({ where: { employeeId: employee.id } });
  if (existing) {
    const wait = existing.sentAt.getTime() + config.otp.resendMs - Date.now();
    if (wait > 0) {
      throw new AppError(429, 'OTP_COOLDOWN', 'Please wait before requesting another code', {
        retryAfterSeconds: Math.ceil(wait / 1000),
      });
    }
  }
  const code = generateOtp();
  const data = {
    codeHash: await hashOtp(code),
    attempts: 0,
    expiresAt: new Date(Date.now() + config.otp.ttlMs),
    sentAt: new Date(),
  };
  await prisma.otpChallenge.upsert({
    where: { employeeId: employee.id },
    create: { employeeId: employee.id, ...data },
    update: data,
  });
  await sendOtp(employee.email, code, ttlMinutes);
  return {
    message: 'Verification code sent',
    expiresInSeconds: config.otp.ttlMs / 1000,
    ...(config.otp.demo ? { devOtp: code } : {}), // simulation only, never enabled in production
  };
}

/** POST /api/auth/register-employee: stores the pending (unverified) employee and sends an OTP. */
async function register(req, res) {
  const input = parse(registerSchema, req.body);
  const found = await prisma.employee.findUnique({ where: { email: input.email } });
  if (found?.verified) throw new AppError(409, 'ALREADY_REGISTERED', 'This email is already registered');

  const fields = {
    fullName: input.fullName,
    dob: new Date(`${input.dob}T00:00:00Z`),
    bio: input.bio,
    experience: input.experience,
  };
  const employee = found
    ? await prisma.employee.update({ where: { id: found.id }, data: fields })
    : await prisma.employee.create({ data: { ...fields, email: input.email } });

  const sent = await issueOtp(employee);
  res.status(201).json({ ...sent, email: employee.email, status: 'PENDING_VERIFICATION' });
}

/** POST /api/auth/resend-otp: a new code for an unverified registration. */
async function resend(req, res) {
  const { email } = parse(resendSchema, req.body);
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee || employee.verified) {
    // Same answer either way, so the endpoint does not reveal which emails exist.
    return res.json({ message: 'If a pending registration exists, a new code was sent' });
  }
  res.json(await issueOtp(employee));
}

/**
 * POST /api/auth/verify-otp: checks the code, then issues the unique tracking ID and the QR badge.
 * The client IP comes from req.ip. Express derives it from the socket, or from X-Forwarded-For only
 * when TRUST_PROXY says how many proxies to trust (so a caller cannot forge it).
 */
async function verifyOtp(req, res) {
  const { email, otp } = parse(verifySchema, req.body);
  const bad = () => new AppError(400, 'INVALID_OTP', 'Invalid or expired code');

  const employee = await prisma.employee.findUnique({ where: { email }, include: { otp: true } });
  if (!employee || !employee.otp) throw bad();
  if (employee.verified) throw new AppError(409, 'ALREADY_VERIFIED', 'This registration is already verified');

  const challenge = employee.otp;
  if (challenge.expiresAt < new Date()) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    throw bad();
  }
  if (challenge.attempts >= config.otp.maxAttempts) {
    throw new AppError(429, 'OTP_LOCKED', 'Too many wrong attempts. Request a new code');
  }
  if (!(await checkOtp(otp, challenge.codeHash))) {
    const { attempts } = await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError(400, 'INVALID_OTP', 'Invalid or expired code', {
      attemptsLeft: Math.max(config.otp.maxAttempts - attempts, 0),
    });
  }

  const ip = clientIp(req);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const uniqueId = await nextSmartId(ip);
    const qrCodeUrl = await createBadgeQr(uniqueId);
    try {
      const [done] = await prisma.$transaction([
        prisma.employee.update({
          where: { id: employee.id },
          data: { verified: true, verifiedAt: new Date(), uniqueTrackingId: uniqueId, clientIp: ip, qrCodeUrl },
        }),
        prisma.otpChallenge.delete({ where: { id: challenge.id } }),
      ]);
      return res.json({ message: 'Registration verified', badge: publicProfile(done, 'minimal'), badgeUrl: `/badge/${uniqueId}` });
    } catch (e) {
      if (e.code !== 'P2002') throw e; // another request took this ID in the same second: try the next one
    }
  }
  throw new AppError(503, 'ID_UNAVAILABLE', 'Could not allocate a tracking ID, please retry');
}

async function findVerified(uniqueId) {
  if (!/^\d{22,}$/.test(uniqueId)) return null;
  const emp = await prisma.employee.findUnique({ where: { uniqueTrackingId: uniqueId } });
  return emp && emp.verified ? emp : null;
}

/** GET /api/employee/:uniqueId: public verified profile (what a QR scan opens). */
async function getByUniqueId(req, res) {
  const emp = await findVerified(req.params.uniqueId);
  if (!emp) throw new AppError(404, 'NOT_FOUND', 'No verified employee with this ID');
  res.json({ employee: publicProfile(emp), profileMode: config.profileMode });
}

module.exports = { register, resend, verifyOtp, getByUniqueId, findVerified };
