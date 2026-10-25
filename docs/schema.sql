-- مخطط PostgreSQL المستهدف لمنصة nmrievent (يحل محل مخزن JSON في النموذج الأولي)
-- يطابق الأنواع في src/server/types.ts

CREATE TABLE staff (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  education    TEXT NOT NULL CHECK (education IN ('الثانوية العامة','دبلوم','بكالوريوس','دراسات عليا')),
  email        TEXT NOT NULL UNIQUE,
  verified_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  reference          TEXT PRIMARY KEY,
  received_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at  TIMESTAMPTZ,
  stage              TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','qualified','proposal','won','lost')),
  kind TEXT NOT NULL, tier TEXT NOT NULL, guests INT NOT NULL, days INT NOT NULL, city TEXT NOT NULL,
  add_ons TEXT[] NOT NULL DEFAULT '{}',
  event_date DATE, venue_status TEXT, budget TEXT, goals TEXT,
  name TEXT NOT NULL, organization TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
  estimate_low NUMERIC, estimate_mid NUMERIC, estimate_high NUMERIC
);

CREATE TABLE projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  event_date    DATE NOT NULL,
  location      TEXT NOT NULL,
  area          TEXT NOT NULL,
  services      TEXT NOT NULL,
  duration      TEXT NOT NULL,
  entity        TEXT NOT NULL,
  supervisor    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'دراسة وتحديد المتطلبات',
  geo_lat       DOUBLE PRECISION NOT NULL,
  geo_lng       DOUBLE PRECISION NOT NULL,
  geo_radius_m  INT NOT NULL DEFAULT 300,
  reference     TEXT REFERENCES leads(reference),
  client_email  TEXT,
  parking_capacity INT NOT NULL DEFAULT 0,
  parking_occupied INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE milestones (
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  key        TEXT CHECK (key IN ('planning','design','execution','delivery')),
  status     TEXT NOT NULL CHECK (status IN ('done','current','upcoming')),
  date       DATE,
  note       TEXT,
  PRIMARY KEY (project_id, key)
);

CREATE TABLE approvals (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  kind       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  signed_by  TEXT,
  signed_at  TIMESTAMPTZ,
  signature  BYTEA   -- يُخزن مشفرًا (At-Rest Encryption)
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, kind TEXT NOT NULL, date DATE NOT NULL, file_url TEXT
);

CREATE TABLE assignments (
  project_id   TEXT REFERENCES projects(id) ON DELETE CASCADE,
  staff_id     TEXT REFERENCES staff(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  shift_start  TIMESTAMPTZ NOT NULL,
  shift_end    TIMESTAMPTZ NOT NULL,
  notified_at  TIMESTAMPTZ,
  check_in_at  TIMESTAMPTZ, check_in_distance_m INT, check_in_method TEXT,
  check_out_at TIMESTAMPTZ,
  PRIMARY KEY (project_id, staff_id)
);

CREATE TABLE zones (
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT, capacity INT NOT NULL, current INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, name)
);

-- رموز OTP تُحفظ في Redis بمهلة انتهاء 10 دقائق (المفتاح: otp:<email>)
