'use strict';
const R = require('./complianceRules');

const round1 = (n) => Math.round(n * 10) / 10;
const maxOccupancy = (area, density) => Math.floor(area / density);

function exitsFor(load) {
  return R.exitsByLoad.find((b) => load <= b.upTo).exits;
}

/** Permit checklists. The ids are stable keys (the UI translates them); `required` can depend on the input. */
function permitChecklists({ eventType, venueType, crowd }) {
  const lists = [];

  if (eventType === 'exhibition' || eventType === 'conference' || eventType === 'corporate') {
    lists.push({
      authority: 'SECA',
      items: [
        { id: 'seca_licence', required: true },
        { id: 'seca_floorplan', required: true },
        { id: 'seca_exhibitors', required: eventType === 'exhibition' },
        { id: 'seca_contractor', required: true },
        { id: 'seca_insurance', required: true },
      ],
    });
  }
  if (eventType === 'entertainment') {
    lists.push({
      authority: 'GEA',
      items: [
        { id: 'gea_licence', required: true },
        { id: 'gea_content', required: true },
        { id: 'gea_security', required: crowd > 500 },
        { id: 'gea_ticketing', required: true },
      ],
    });
  }
  lists.push({
    authority: 'CIVIL_DEFENSE',
    items: [
      { id: 'cd_safety_plan', required: true },
      { id: 'cd_evacuation', required: true },
      { id: 'cd_flame_cert', required: true },
      { id: 'cd_electrical', required: true },
      { id: 'cd_crowd_plan', required: crowd >= 100 },
      { id: 'cd_firstaid', required: true },
      { id: 'cd_outdoor_weather', required: venueType === 'OUTDOOR' },
    ].filter((i) => i.id !== 'cd_outdoor_weather' || i.required),
  });

  return lists.map((l) => ({ ...l, items: l.items.map((i) => ({ ...i, required: Boolean(i.required) })) }));
}

/**
 * Pre-check for a public assembly event. Pure function: same input, same output, no I/O.
 * @param {{area:number, crowd:number, venueType:'INDOOR'|'OUTDOOR', eventType:string, density:number, duration:number}} input
 */
function calculateCompliance(input) {
  const { area, crowd, venueType, eventType, density, duration } = input;
  const findings = [];

  const capacity = {
    dense: maxOccupancy(area, R.density.min), // 1.5 m²/person: legal ceiling of this tool
    standard: maxOccupancy(area, R.density.standard),
    comfortable: maxOccupancy(area, R.density.max),
    selected: maxOccupancy(area, density),
    selectedDensity: density,
  };

  const actual = round1(area / crowd);
  let band = 'comfortable';
  if (actual < R.density.min) band = 'overcrowded';
  else if (actual < R.density.standard) band = 'tight';
  else if (actual < R.density.max) band = 'standard';

  if (crowd > capacity.dense) {
    findings.push({ severity: 'critical', code: 'OVER_MAX_CAPACITY', values: { crowd, max: capacity.dense } });
  } else if (crowd > capacity.selected) {
    findings.push({ severity: 'warning', code: 'OVER_SELECTED_DENSITY', values: { crowd, max: capacity.selected, density } });
  }

  const exits = exitsFor(crowd);
  const totalWidthM = round1((crowd * R.exitWidthMmPerPerson) / 1000);
  const perExitM = Math.max(R.minDoorWidthM, round1(totalWidthM / exits));
  const egress = { requiredExits: exits, totalWidthM, perExitWidthM: perExitM, minDoorWidthM: R.minDoorWidthM };

  const extinguishers = Math.max(R.minExtinguishers, Math.ceil(area / R.extinguisherPerM2));
  const fire = {
    extinguishers,
    flameRetardant: ['booth_fabrics', 'drapes_banners', 'wood_panels', 'foam_graphics', 'carpets'],
    emergencyLighting: true,
    exitSignage: true,
    fireAlarm: venueType === 'INDOOR' && crowd > R.indoor.alarmAboveCrowd,
    sprinklers: venueType === 'INDOOR' && area > R.indoor.sprinklerAboveM2,
  };

  const outdoor =
    venueType === 'OUTDOOR'
      ? {
          waterPoints: Math.max(1, Math.ceil(crowd / R.outdoor.waterPointPerPeople)),
          shadeAndCooling: true,
          weatherPlan: true,
        }
      : null;

  if (venueType === 'OUTDOOR') findings.push({ severity: 'info', code: 'OUTDOOR_HEAT_PLAN', values: {} });
  if (fire.sprinklers) findings.push({ severity: 'info', code: 'SPRINKLERS_REQUIRED', values: { area } });
  if (duration > 14) findings.push({ severity: 'info', code: 'LONG_DURATION', values: { duration } });

  const status = findings.some((f) => f.severity === 'critical')
    ? 'NON_COMPLIANT'
    : findings.some((f) => f.severity === 'warning')
      ? 'CONDITIONAL'
      : 'COMPLIANT';

  return {
    input,
    status,
    capacity,
    density: { actual, band },
    egress,
    fire,
    outdoor,
    permits: permitChecklists({ eventType, venueType, crowd }),
    findings,
    disclaimer: 'Pre-check calculated from configurable engineering defaults. It is not an official approval.',
  };
}

/** Compares submitted permit item ids against the required ones. */
function validateChecklist(input, done) {
  const calc = calculateCompliance(input);
  const doneSet = new Set(done);
  let required = 0;
  let completed = 0;
  const missing = [];
  const authorities = calc.permits.map((p) => {
    const items = p.items.map((i) => {
      const isDone = doneSet.has(i.id);
      if (i.required) {
        required += 1;
        if (isDone) completed += 1;
        else missing.push({ authority: p.authority, id: i.id });
      }
      return { ...i, done: isDone };
    });
    return { authority: p.authority, items };
  });
  const knownIds = new Set(calc.permits.flatMap((p) => p.items.map((i) => i.id)));
  return {
    status: calc.status,
    ready: calc.status !== 'NON_COMPLIANT' && missing.length === 0,
    progress: { required, completed, percent: required ? Math.round((completed / required) * 100) : 100 },
    missing,
    unknown: done.filter((id) => !knownIds.has(id)),
    authorities,
  };
}

module.exports = { calculateCompliance, validateChecklist, maxOccupancy, exitsFor };
