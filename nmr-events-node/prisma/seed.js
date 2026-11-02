'use strict';
// Optional demo data: one event project with its planned crew, so /crowd has something to monitor.
// Safe to run twice: it only creates the demo project when it does not exist yet.
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const { calculateCompliance } = require('../src/utils/compliance');
const { buildStaffingTree } = require('../src/utils/crowd');

const prisma = new PrismaClient();

async function main() {
  const name = 'NMR Demo Expo (sample)';
  if (await prisma.eventProject.findFirst({ where: { clientName: name } })) {
    console.log('Demo project already exists, nothing to do.');
    return;
  }
  const input = { area: 1800, crowd: 700, venueType: 'INDOOR', eventType: 'exhibition', density: 2, duration: 3 };
  const result = calculateCompliance(input);
  const project = await prisma.eventProject.create({
    data: {
      clientName: name, spaceArea: input.area, duration: input.duration, venueType: 'INDOOR',
      eventType: input.eventType, capacity: input.crowd, currentOccupancy: 180, complianceStatus: result.status,
    },
  });
  const { flat } = buildStaffingTree({ area: input.area, crowd: input.crowd, venueType: input.venueType });
  const rows = flat.flatMap((n) => Array.from({ length: n.count }, () => ({ role: n.role, zone: n.zone, assignedEventId: project.id })));
  await prisma.crowdStaff.createMany({ data: rows });
  console.log(`Created "${name}" (${project.id}) with ${rows.length} planned staff.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
