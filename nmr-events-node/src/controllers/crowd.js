'use strict';
const prisma = require('../db');
const { AppError } = require('../utils/errors');
const { parse, calcSchema, occupancySchema, staffStatusSchema } = require('../utils/validate');
const { buildStaffingTree, occupancyLevel } = require('../utils/crowd');

/** GET /api/crowd/plan?area=&crowd=&venueType=: staffing hierarchy for the given size (public planner). */
function plan(req, res) {
  const q = parse(calcSchema, req.query);
  res.json(buildStaffingTree({ area: q.area, crowd: q.crowd, venueType: q.venueType }));
}

const summary = (e) => ({
  id: e.id, clientName: e.clientName, venueType: e.venueType, eventType: e.eventType,
  spaceArea: e.spaceArea, capacity: e.capacity, currentOccupancy: e.currentOccupancy,
  complianceStatus: e.complianceStatus, ...occupancyLevel(e.currentOccupancy, e.capacity),
});

async function mustFind(id) {
  const e = await prisma.eventProject.findUnique({ where: { id } });
  if (!e) throw new AppError(404, 'NOT_FOUND', 'Event project not found');
  return e;
}

/** GET /api/event-projects (operator) */
async function listEvents(req, res) {
  const events = await prisma.eventProject.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ events: events.map(summary) });
}

/** GET /api/crowd/:id/status (operator): live capacity and staff headcount by status. */
async function status(req, res) {
  const e = await mustFind(req.params.id);
  const staff = await prisma.crowdStaff.groupBy({ by: ['status'], where: { assignedEventId: e.id }, _count: { _all: true } });
  res.json({
    ...summary(e),
    staff: Object.fromEntries(staff.map((s) => [s.status, s._count._all])),
    at: new Date().toISOString(),
  });
}

/** POST /api/crowd/:id/occupancy (operator): body {count} sets it, {delta} adds or subtracts atomically. */
async function setOccupancy(req, res) {
  const { count, delta } = parse(occupancySchema, req.body);
  await mustFind(req.params.id);
  let e;
  if (count !== undefined) {
    e = await prisma.eventProject.update({ where: { id: req.params.id }, data: { currentOccupancy: count } });
  } else {
    // One SQL statement keeps concurrent gate scanners consistent; GREATEST stops it going below zero.
    const rows = await prisma.$queryRaw`
      UPDATE "EventProject" SET "currentOccupancy" = GREATEST("currentOccupancy" + ${delta}, 0)
      WHERE id = ${req.params.id} RETURNING *`;
    e = rows[0];
  }
  res.json(summary(e));
}

/** POST /api/crowd/:id/staff/generate (operator): replaces the planned staff with the computed hierarchy. */
async function generateStaff(req, res) {
  const e = await mustFind(req.params.id);
  const { flat, totals } = buildStaffingTree({ area: e.spaceArea, crowd: Math.max(e.capacity, 1), venueType: e.venueType });
  const rows = flat.flatMap((n) => Array.from({ length: n.count }, () => ({ role: n.role, zone: n.zone, assignedEventId: e.id })));
  await prisma.$transaction([
    prisma.crowdStaff.deleteMany({ where: { assignedEventId: e.id, status: 'PLANNED' } }),
    prisma.crowdStaff.createMany({ data: rows }),
  ]);
  res.status(201).json({ created: rows.length, totals });
}

/** GET /api/crowd/:id/staff (operator) */
async function listStaff(req, res) {
  await mustFind(req.params.id);
  const staff = await prisma.crowdStaff.findMany({ where: { assignedEventId: req.params.id }, orderBy: [{ zone: 'asc' }, { role: 'asc' }], take: 2000 });
  res.json({ staff });
}

/** PATCH /api/crowd/staff/:staffId (operator): change one staff member's status. */
async function updateStaff(req, res) {
  const { status: next } = parse(staffStatusSchema, req.body);
  const s = await prisma.crowdStaff.update({ where: { id: req.params.staffId }, data: { status: next } }).catch((e) => {
    if (e.code === 'P2025') throw new AppError(404, 'NOT_FOUND', 'Staff member not found');
    throw e;
  });
  res.json({ staff: s });
}

module.exports = { plan, listEvents, status, setOccupancy, generateStaff, listStaff, updateStaff };
