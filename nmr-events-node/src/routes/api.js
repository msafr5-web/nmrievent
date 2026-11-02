'use strict';
const express = require('express');
const { asyncHandler: h } = require('../utils/errors');
const { limits, requireAdmin } = require('../middleware/security');
const employee = require('../controllers/employee');
const compliance = require('../controllers/compliance');
const crowd = require('../controllers/crowd');
const projects = require('../controllers/projects');

const r = express.Router();

// Employee registration and QR badge
r.post('/auth/register-employee', limits.auth, h(employee.register));
r.post('/auth/resend-otp', limits.auth, h(employee.resend));
r.post('/auth/verify-otp', limits.auth, h(employee.verifyOtp));
r.get('/employee/:uniqueId', limits.publicProfile, h(employee.getByUniqueId));

// Compliance engine and public crowd planner (pure calculations, no database)
r.get('/compliance/calculate', limits.calc, compliance.calculate);
r.post('/compliance/validate', limits.calc, compliance.validate);
r.get('/crowd/plan', limits.calc, crowd.plan);

// Portfolio and 3D assets
r.get('/projects', projects.list);

// Operator endpoints (x-admin-key)
const admin = [limits.admin, requireAdmin];
r.post('/event-projects', ...admin, h(compliance.saveProject));
r.get('/event-projects', ...admin, h(crowd.listEvents));
r.get('/crowd/:id/status', ...admin, h(crowd.status));
r.post('/crowd/:id/occupancy', ...admin, h(crowd.setOccupancy));
r.post('/crowd/:id/staff/generate', ...admin, h(crowd.generateStaff));
r.get('/crowd/:id/staff', ...admin, h(crowd.listStaff));
r.patch('/crowd/staff/:staffId', ...admin, h(crowd.updateStaff));

module.exports = r;
