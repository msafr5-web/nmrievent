'use strict';
// Every number the compliance engine uses lives here, so it can be reviewed and changed in one place.
// The defaults are engineering values modelled on widely used codes (NFPA 101 / IBC style egress and
// extinguisher rules). They are NOT official SECA, GEA or Civil Defense figures. Confirm each one
// against the current Saudi Building Code and the authority's requirements before relying on it.

module.exports = {
  // m² per person: 1.5 = dense standing crowd, 2.0 = standard, 2.5 = comfortable circulation.
  density: { min: 1.5, standard: 2.0, max: 2.5 },

  // Minimum number of separate exits by occupant load (NFPA 101 style: 2 / 3 / 4).
  exitsByLoad: [
    { upTo: 500, exits: 2 },
    { upTo: 1000, exits: 3 },
    { upTo: Infinity, exits: 4 },
  ],
  exitWidthMmPerPerson: 5.1, // level egress components (0.2 in per person)
  minDoorWidthM: 0.9,

  extinguisherPerM2: 250, // one portable extinguisher per 250 m², at least 2
  minExtinguishers: 2,

  indoor: { sprinklerAboveM2: 1000, alarmAboveCrowd: 50 },
  outdoor: { waterPointPerPeople: 500, shadeAboveHours: 0 },

  // Staffing ratios used by the crowd module.
  staffing: {
    zoneSupervisor: { perPeople: 500, perM2: 1500 }, // whichever needs more
    safety: { perPeople: 150 },
    ushering: { perPeople: 100 },
    firstAid: { perPeople: 500, min: 2 },
    zoneMinPeople: 100,
  },

  // Occupancy bands (share of the maximum occupancy at the densest allowed layout).
  levels: { busy: 0.7, near: 0.9 },
};
