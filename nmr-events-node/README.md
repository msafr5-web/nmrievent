# NMR Events: Node.js platform

Event management, exhibition construction and interior design platform for NMR Events (Saudi Arabia).
Express + EJS, PostgreSQL through Prisma, Tailwind CSS, Three.js.

| Module | Where |
| --- | --- |
| Landing and portfolio | `/` , `GET /api/projects` |
| Interactive 3D booth / stage viewer (Three.js) | `/booth` |
| Saudi compliance engine (capacity, exits, fire safety, SECA / GEA / Civil Defense checklist) | `/compliance`, `GET /api/compliance/calculate`, `POST /api/compliance/validate` |
| Crowd management: staffing tree and live capacity monitor | `/crowd`, `/api/crowd/*`, `/api/event-projects` |
| Crew registration, OTP, Smart ID and QR badge | `/register`, `/badge/:id`, `/api/auth/*`, `GET /api/employee/:uniqueId` |

The interface is bilingual (English / Arabic, with RTL) and switches from the header button.

## Run it

Requirements: Node.js 20 or newer, PostgreSQL 14 or newer.

```bash
cd nmr-events-node
npm install                      # also runs "prisma generate"
cp .env.example .env             # then edit DATABASE_URL, BASE_URL, ADMIN_API_KEY
npx prisma migrate dev           # creates the tables (use "npx prisma migrate deploy" in production)
npm run seed                     # optional: a demo event with a planned crew
npm start                        # http://localhost:3000
```

Create the database first if needed:

```bash
createdb nmr_events   # or: psql -c 'CREATE DATABASE nmr_events;'
```

Tailwind output is committed (`public/css/app.css`). After editing views or `input.css`, run `npm run build:css`
(`npm run dev:css` watches). `npm run dev` restarts the server on file changes.

### Try the registration flow

1. Open `/register`, fill the form. With `OTP_DEMO_MODE=true` the 6-digit code appears on screen (and in the server log).
2. Enter the code. You get the tracking ID, the QR badge and the public profile page `/badge/<id>`.
3. Scan the QR code: it opens that profile page.

### Operator endpoints

`/api/event-projects`, `/api/crowd/:id/*` need the header `x-admin-key: <ADMIN_API_KEY>`. If `ADMIN_API_KEY` is empty they answer 503.
The live monitor on `/crowd` asks for that key (kept in the page only, never stored).

```bash
KEY=your-admin-key
curl -X POST localhost:3000/api/event-projects -H "x-admin-key: $KEY" -H 'content-type: application/json' \
  -d '{"clientName":"Riyadh Expo","spaceArea":1500,"duration":3,"venueType":"INDOOR","eventType":"exhibition","capacity":600}'
curl -X POST localhost:3000/api/crowd/<id>/occupancy -H "x-admin-key: $KEY" -H 'content-type: application/json' -d '{"delta":25}'
```

## API summary

| Method and path | Purpose |
| --- | --- |
| `POST /api/auth/register-employee` | Validates the form, stores the employee as unverified, sends a 6-digit OTP |
| `POST /api/auth/verify-otp` | Checks the OTP, creates the Smart ID from the client IP, writes the QR image, marks the employee verified |
| `POST /api/auth/resend-otp` | New code for an unverified registration (30 s cooldown) |
| `GET /api/employee/:uniqueId` | Public verified profile (what the QR opens) |
| `GET /api/compliance/calculate` | `area`, `crowd`, `venueType`, `eventType`, `density`, `duration` |
| `POST /api/compliance/validate` | Same inputs plus `done: [permit ids]`: progress and missing items |
| `GET /api/crowd/plan` | Staffing hierarchy for an area and crowd |
| `GET /api/projects` | Portfolio items and the 3D booth assets (`?category=`) |
| `POST/GET /api/event-projects`, `/api/crowd/:id/*` | Operator: projects, live occupancy, staff (key required) |
| `GET /healthz` | Liveness probe |

Errors always look like `{"error":{"code":"...","message":"..."}}`; validation errors add `fields`.

## Smart tracking ID

`DDMM` + `IP as 12 digits` + `HHMMSS`, in Saudi time (Asia/Riyadh). It reproduces the example in the brief exactly:

```
1204 | 111121134009 | 144526   ->  1204111121134009144526
12 Apr | 111.121.134.9 | 14:45:26
```

* Each IPv4 octet is zero padded to 3 digits. An IPv4-mapped IPv6 address (`::ffff:a.b.c.d`) is unwrapped and `::1` becomes `127.0.0.1`. A real IPv6 address has no 4-octet form, so it is mapped to 12 digits from its SHA-256 hash (same address, same digits).
* The brief lists a "sequence" part, but its example has none. To keep every ID identical to the example, a 2-digit sequence (`01`, `02`, ...) is appended **only** when the same date, address and second were already issued. The database unique constraint, with a retry, covers concurrent requests.
* The IP is `req.ip`. Behind a reverse proxy set `TRUST_PROXY` to the number of proxies so Express reads `X-Forwarded-For` safely. With `TRUST_PROXY=0` the header is ignored, so callers cannot forge their address.

## Compliance engine

`src/utils/complianceRules.js` holds every number (densities 1.5 to 2.5 m² per person, exit counts, door width, extinguisher ratio, staffing ratios).
They are **engineering defaults modelled on common codes** (NFPA 101 / IBC style), not official SECA, GEA or Civil Defense values.
Review each one against the current Saudi Building Code and the authority's rules before relying on it. The API returns a `disclaimer` and the result is a pre-check, not an approval.

## Security notes

* Helmet with a strict CSP (scripts only from this origin plus a per-request nonce, no `unsafe-eval`), `X-Frame-Options`, `nosniff`, HSTS in production.
* Rate limits per IP: registration / OTP endpoints 20 per 15 min, operator 600, public profile 120, calculators 300, everything else 600. `RATE_LIMIT_MULTIPLIER` exists for tests only.
* OTP: `crypto.randomInt`, stored as a bcrypt hash, 10 minute expiry, 5 attempts, resend cooldown. `OTP_DEMO_MODE` returns the code in the response and is refused when `NODE_ENV=production`. Set `SMTP_*` to send real email; without it the code is only printed in the server log (the "OTP simulation").
* All input is validated with zod (types, ranges, age 16 to 80, control characters stripped). Prisma parameterises every query; the one raw query binds its values. EJS escapes all output and the page scripts build the DOM with `textContent`.
* Operator key is compared in constant time (hashed first).
* Personal data (PDPL): the public badge page shows name, experience, bio and a masked email, and **hides the date of birth**. Set `PUBLIC_PROFILE_MODE=full` to show the whole profile as in the original brief. The QR image only holds the badge URL, never personal data. The raw client IP is stored on the employee row because the brief asks for it; decide a retention period and a privacy notice before launch.
* `npm audit` reports `prisma` (CLI config loader) and `uuid` (only the v3/v5/v6 `buf` form, which this code does not use). Neither is reachable at runtime.

## Tests

```bash
npm test                                   # unit tests, i18n coverage, and (with DATABASE_URL) the API tests on PostgreSQL
DATABASE_URL=... npm test                  # run the migration first: npx prisma migrate deploy
```

The integration tests cover the whole registration flow, OTP lock and expiry, Smart ID collisions, hostile input, security headers,
the operator key and 25 concurrent occupancy updates. Their rows are deleted afterwards.

## Layout

```
nmr-events-node
├── package.json
├── prisma/            schema.prisma, migrations/, seed.js
├── public/            css/ js/ qrcodes/ favicon.svg
├── src/
│   ├── app.js         app factory and server start
│   ├── config.js      validated environment
│   ├── controllers/   employee, compliance, crowd, projects
│   ├── routes/        api.js, pages.js
│   ├── middleware/    security.js (CSP, limits, operator key), errors.js
│   ├── utils/         smartId, ip, otp, qr, mailer, compliance, complianceRules, crowd, validate, profile
│   └── data/          portfolio.js (placeholder portfolio and 3D assets)
├── tests/
└── views/             EJS pages and partials
```

## Before launch

* Replace the placeholder portfolio in `src/data/portfolio.js` and the brand assets.
* Review `complianceRules.js` with a licensed fire and safety engineer.
* Add SMTP settings, a real `BASE_URL`, HTTPS, and `TRUST_PROXY`. Host in a Saudi region if PDPL data residency applies to you.
* Decide who may use the operator endpoints. A single shared key is fine for a pilot; for a team add user accounts.
