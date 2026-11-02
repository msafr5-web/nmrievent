'use strict';
const config = require('../config');

let transport = null;
function getTransport() {
  if (!config.smtp) return null;
  if (!transport) {
    const nodemailer = require('nodemailer');
    transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transport;
}

/**
 * Sends the verification code. With SMTP configured it sends a real email; otherwise it only
 * simulates delivery by printing the code in the server log (the "OTP simulation" of the brief).
 */
async function sendOtp(email, code, ttlMinutes) {
  const t = getTransport();
  if (!t) {
    console.log(`[otp-simulation] code for ${email}: ${code} (valid ${ttlMinutes} min)`);
    return { delivered: false };
  }
  await t.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'NMR Events verification code',
    text: `Your verification code is ${code}. It is valid for ${ttlMinutes} minutes.`,
  });
  return { delivered: true };
}

module.exports = { sendOtp };
