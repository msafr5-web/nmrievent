'use strict';
const prisma = require('../db');
const { parse, calcSchema, validateChecklistSchema, eventProjectSchema } = require('../utils/validate');
const { calculateCompliance, validateChecklist } = require('../utils/compliance');

/** GET /api/compliance/calculate?area=&crowd=&venueType=&eventType=&density=&duration= */
function calculate(req, res) {
  res.json(calculateCompliance(parse(calcSchema, req.query)));
}

/** POST /api/compliance/validate: compares the permit items the client says are done with the required ones. */
function validate(req, res) {
  const { done, ...input } = parse(validateChecklistSchema, req.body);
  res.json(validateChecklist(input, done));
}

/** POST /api/event-projects (operator): saves a project together with its computed compliance status. */
async function saveProject(req, res) {
  const p = parse(eventProjectSchema, req.body);
  const result = calculateCompliance({
    area: p.spaceArea, crowd: p.capacity, venueType: p.venueType, eventType: p.eventType, density: p.density, duration: p.duration,
  });
  const project = await prisma.eventProject.create({
    data: {
      clientName: p.clientName, spaceArea: p.spaceArea, duration: p.duration, venueType: p.venueType,
      eventType: p.eventType, capacity: p.capacity, complianceStatus: result.status,
    },
  });
  res.status(201).json({ project, compliance: result });
}

module.exports = { calculate, validate, saveProject };
