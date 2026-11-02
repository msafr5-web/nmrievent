'use strict';
// Portfolio and 3D booth assets served by GET /api/projects.
// The entries are placeholders: replace them with the real NMR Events work and brand assets.
// Booth `params` drive the procedural 3D model in public/js/booth.js (no external model files needed).

const portfolio = [
  { id: 'p1', category: 'exhibition', title: 'Smart City Expo Pavilion', client: 'Placeholder client', year: 2025, area: 144, services: ['3d', 'print', 'event'] },
  { id: 'p2', category: 'event', title: 'National Day Main Stage', client: 'Placeholder client', year: 2025, area: 600, services: ['3d', 'motion', 'event'] },
  { id: 'p3', category: 'interior', title: 'Corporate Lounge Fit-out', client: 'Placeholder client', year: 2024, area: 220, services: ['3d', 'print'] },
  { id: 'p4', category: 'branding', title: 'Product Launch Identity & Motion', client: 'Placeholder client', year: 2024, area: 0, services: ['graphic', 'motion'] },
  { id: 'p5', category: 'exhibition', title: 'Energy Forum Island Booth', client: 'Placeholder client', year: 2024, area: 96, services: ['3d', 'print'] },
  { id: 'p6', category: 'event', title: 'Gala Dinner & Awards', client: 'Placeholder client', year: 2023, area: 450, services: ['graphic', 'event'] },
];

const booths = [
  {
    id: 'booth-island',
    name: 'Island booth 6 x 6 m',
    kind: 'booth',
    deliverables: ['CAD', 'CNC cut files', 'Render pack'],
    params: { width: 6, depth: 6, height: 3.2, accent: '#f59e0b', screen: true, counter: true },
  },
  {
    id: 'booth-corner',
    name: 'Corner booth 4 x 4 m',
    kind: 'booth',
    deliverables: ['CAD', 'CNC cut files'],
    params: { width: 4, depth: 4, height: 3, accent: '#a855f7', screen: true, counter: true },
  },
  {
    id: 'stage-main',
    name: 'Event stage 10 x 6 m',
    kind: 'stage',
    deliverables: ['CAD', 'Rigging plan', 'Render pack'],
    params: { width: 10, depth: 6, height: 4.5, accent: '#f97316', screen: true, counter: false },
  },
];

module.exports = { portfolio, booths };
