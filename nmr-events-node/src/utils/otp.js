'use strict';
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');

// 6 digits from a CSPRNG (never Math.random). randomInt is unbiased.
const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

// Only the hash is stored, so a database leak does not reveal live codes.
const hashOtp = (code) => bcrypt.hash(code, 10);
const checkOtp = (code, hash) => bcrypt.compare(code, hash);

module.exports = { generateOtp, hashOtp, checkOtp };
