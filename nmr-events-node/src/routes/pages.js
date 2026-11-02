'use strict';
const express = require('express');
const { asyncHandler: h, AppError } = require('../utils/errors');
const { findVerified } = require('../controllers/employee');
const { publicProfile } = require('../utils/profile');
const { limits } = require('../middleware/security');
const config = require('../config');

const r = express.Router();
const page = (view, title) => (req, res) => res.render(view, { title, path: req.path });

r.get('/', page('index', 'NMR Events'));
r.get('/booth', page('booth', '3D Booth Viewer'));
r.get('/compliance', page('compliance', 'Compliance Engine'));
r.get('/crowd', page('crowd', 'Crowd Management'));
r.get('/register', page('register', 'Crew Registration'));

r.get('/badge/:uniqueId', limits.publicProfile, h(async (req, res) => {
  const emp = await findVerified(req.params.uniqueId);
  if (!emp) throw new AppError(404, 'NOT_FOUND', 'No verified employee with this ID');
  res.render('badge', { title: emp.fullName, path: '/badge', p: publicProfile(emp), mode: config.profileMode });
}));

module.exports = r;
