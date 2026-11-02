'use strict';
const config = require('../config');

const maskEmail = (e) => {
  const [user, domain] = e.split('@');
  return `${user.slice(0, 1)}${'*'.repeat(Math.max(user.length - 1, 2))}@${domain}`;
};

/**
 * The public view of an employee (what a QR scan shows).
 * minimal (default): no date of birth, masked email. full: the whole verified profile.
 */
function publicProfile(emp, mode = config.profileMode) {
  const base = {
    uniqueId: emp.uniqueTrackingId,
    fullName: emp.fullName,
    verified: emp.verified,
    verifiedAt: emp.verifiedAt,
    experience: emp.experience,
    bio: emp.bio,
    qrCodeUrl: emp.qrCodeUrl,
  };
  return mode === 'full'
    ? { ...base, email: emp.email, dob: emp.dob.toISOString().slice(0, 10) }
    : { ...base, email: maskEmail(emp.email) };
}

module.exports = { publicProfile, maskEmail };
