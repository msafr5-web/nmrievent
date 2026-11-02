'use strict';
const R = require('./complianceRules');

/**
 * Builds the staffing hierarchy for an event:
 *   Event Director -> Zone Supervisors -> (Safety & Ushering, First Aid) per zone
 * Numbers come from the ratios in complianceRules.staffing and are split evenly across the zones.
 */
function buildStaffingTree({ area, crowd, venueType }) {
  const S = R.staffing;
  const zones = Math.max(1, Math.ceil(crowd / S.zoneSupervisor.perPeople), Math.ceil(area / S.zoneSupervisor.perM2));
  const safety = Math.max(zones, Math.ceil(crowd / S.safety.perPeople));
  const ushers = Math.max(zones, Math.ceil(crowd / S.ushering.perPeople));
  const firstAid = Math.max(S.firstAid.min, Math.ceil(crowd / S.firstAid.perPeople));

  const split = (total, parts, i) => Math.floor(total / parts) + (i < total % parts ? 1 : 0);

  const children = Array.from({ length: zones }, (_, i) => {
    const zone = `Z${i + 1}`;
    return {
      role: 'ZONE_SUPERVISOR',
      zone,
      count: 1,
      children: [
        { role: 'SAFETY', zone, count: split(safety, zones, i) },
        { role: 'USHER', zone, count: split(ushers, zones, i) },
        { role: 'FIRST_AID', zone, count: split(firstAid, zones, i) },
      ],
    };
  });

  const flat = [{ role: 'EVENT_DIRECTOR', zone: 'HQ', count: 1 }];
  for (const z of children) {
    flat.push({ role: z.role, zone: z.zone, count: 1 });
    for (const c of z.children) flat.push({ role: c.role, zone: c.zone, count: c.count });
  }

  return {
    venueType,
    zones,
    totals: { director: 1, supervisors: zones, safety, ushers, firstAid, all: 1 + zones + safety + ushers + firstAid },
    tree: { role: 'EVENT_DIRECTOR', zone: 'HQ', count: 1, children },
    flat,
  };
}

/** Occupancy level for the live monitor. `capacity` is the planned maximum. */
function occupancyLevel(current, capacity) {
  if (capacity <= 0) return { percent: 0, level: 'unknown' };
  const ratio = current / capacity;
  const percent = Math.round(ratio * 100);
  if (ratio > 1) return { percent, level: 'over' };
  if (ratio >= R.levels.near) return { percent, level: 'near' };
  if (ratio >= R.levels.busy) return { percent, level: 'busy' };
  return { percent, level: 'normal' };
}

module.exports = { buildStaffingTree, occupancyLevel };
