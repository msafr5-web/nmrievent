# Comparison: the Next.js build (PR #1) and this Node.js build

Both implement the NMR / nmrievent idea, from two different briefs. This file records how they differ, so the team can decide how to combine them.

| | Next.js build (`feature/public-site-rfq`, PR #1) | Node.js build (this folder) |
| --- | --- | --- |
| Source brief | PRD + SWOT/SWET + implementation guide | The "NMR Events" Node/Express/Prisma specification |
| Runtime | Next.js 15, React 19, TypeScript | Express 4, EJS, plain browser JavaScript |
| Database | JSON file store (PostgreSQL schema prepared in `docs/schema.sql`) | PostgreSQL through Prisma, with migrations |
| Styling | Tailwind 3, Arabic RTL first | Tailwind 3, English with Arabic RTL switch, purple and orange glow theme |
| 3D | none | Three.js booth and stage viewer (lighting, material, colour, wireframe) |
| Compliance | none | SECA / GEA / Civil Defense engine with capacity, exits, fire safety and a checklist validator |
| Crowd | Ops hub with simulated crowd and parking feed | Staffing hierarchy and a live capacity monitor backed by the database |
| Staff identity | OTP registration, HMAC-signed QR tokens with no personal data, geofenced check-in | OTP registration, Smart ID from date + client IP + time, QR to a public verified profile |
| Sales and clients | Smart RFQ estimator, CRM pipeline, client portal with e-signature | not in this brief |
| Roles | Admin, ops and client sessions (JWT) | one operator key (no user accounts) |
| Tests | 13 unit and 16 browser scenarios | 25 tests, including API tests on PostgreSQL |

## What only the Next.js build has
RFQ configurator and cost estimator, CRM pipeline and project conversion, client portal with milestone tracker and digital signature,
geofenced check-in, role-based sessions, SEO (sitemap, JSON-LD), Docker and CI for that app.

## What only this build has
Three.js 3D viewer, the compliance engine, the Smart ID algorithm from the brief, a real PostgreSQL schema in use, the capacity monitor with atomic counters.

## Recommendation
Keep them as two folders for now. They share a brand but not a stack, and merging early would force one brief to bend to the other.
When the product direction is chosen, the cheapest convergence is to keep this build's backend (Express, Prisma, PostgreSQL) as the API
and port the Next.js build's RFQ, CRM and client portal onto it, or the reverse: move the 3D viewer and compliance engine into Next.js.
Both paths are straightforward because the compliance and Smart ID logic are pure functions (`src/utils/*.js`).
