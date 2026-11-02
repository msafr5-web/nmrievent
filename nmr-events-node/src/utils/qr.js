'use strict';
const path = require('node:path');
const QRCode = require('qrcode');
const config = require('../config');

const DIR = path.join(__dirname, '..', '..', 'public', 'qrcodes');

/**
 * Writes the badge QR code as a PNG and returns its public path.
 * The QR holds the verification URL (which contains the unique tracking ID). Scanning it opens the
 * verified profile, so personal data never sits inside the image itself.
 */
async function createBadgeQr(uniqueId) {
  if (!/^\d{22,}$/.test(uniqueId)) throw new Error('Invalid tracking id'); // also blocks path tricks
  const file = path.join(DIR, `${uniqueId}.png`);
  await QRCode.toFile(file, `${config.baseUrl}/badge/${uniqueId}`, {
    errorCorrectionLevel: 'M',
    width: 480,
    margin: 2,
    color: { dark: '#2a0f4d', light: '#ffffff' },
  });
  return `/qrcodes/${uniqueId}.png`;
}

module.exports = { createBadgeQr, QR_DIR: DIR };
