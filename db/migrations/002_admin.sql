-- لوحة التحكم: المستخدمون والجلسات والدعوات وسجل التدقيق ومعرض الصور وطلبات التقديم

CREATE TABLE IF NOT EXISTS admin_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text        NOT NULL,
  name            text        NOT NULL,
  password_hash   text,                                   -- NULL حتى يقبل المستخدم الدعوة
  is_super        boolean     NOT NULL DEFAULT false,
  permissions     text[]      NOT NULL DEFAULT '{}',
  active          boolean     NOT NULL DEFAULT true,
  failed_logins   integer     NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  created_by      uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_login_at   timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users (lower(email));
-- مدير أعلى واحد فقط
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_single_super ON admin_users (is_super) WHERE is_super;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash    text PRIMARY KEY,                         -- SHA-256 للرمز؛ الرمز نفسه لا يُخزَّن
  user_id       uuid        NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  ip            text,
  user_agent    text
);
CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions (user_id);

CREATE TABLE IF NOT EXISTS admin_invites (
  token_hash  text PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  kind        text        NOT NULL CHECK (kind IN ('invite', 'reset')),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_by  uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           bigserial PRIMARY KEY,
  at           timestamptz NOT NULL DEFAULT now(),
  actor_id     uuid,
  actor_email  text,
  action       text        NOT NULL,
  entity       text,
  entity_id    text,
  details      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  ip           text
);
CREATE INDEX IF NOT EXISTS audit_log_at_idx ON audit_log (at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity, entity_id);

CREATE TABLE IF NOT EXISTS gallery_items (
  id          text PRIMARY KEY,
  category    text        NOT NULL,
  alt         text        NOT NULL,
  src         text        NOT NULL,
  width       integer     NOT NULL CHECK (width > 0),
  height      integer     NOT NULL CHECK (height > 0),
  sort_order  integer     NOT NULL DEFAULT 0,
  visible     boolean     NOT NULL DEFAULT true,
  featured    boolean     NOT NULL DEFAULT false,        -- يظهر في الصفحة الرئيسية
  services    text[]      NOT NULL DEFAULT '{}',         -- يظهر في صفحات هذه الخدمات
  source      text        NOT NULL CHECK (source IN ('seed', 'upload')),
  created_by  uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gallery_items_order_idx ON gallery_items (sort_order, created_at);

-- طلبات التقديم: توظيف/انضمام للكوادر (staff) وطلبات المشاركة في المعارض (exhibition)
CREATE TABLE IF NOT EXISTS applications (
  reference       text PRIMARY KEY,
  kind            text        NOT NULL CHECK (kind IN ('staff', 'exhibition')),
  applicant_name  text        NOT NULL,
  applicant_phone text        NOT NULL,
  applicant_email text        NOT NULL,
  applicant_org   text,
  summary         text,
  payload         jsonb       NOT NULL,
  status          text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'needs_info', 'approved', 'rejected')),
  attachment      text,                                  -- مسار الملف الخاص (السيرة الذاتية) داخل مجلد الرفع
  consent_at      timestamptz NOT NULL,
  policy_version  text        NOT NULL,
  reviewed_by     uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_kind_status_idx ON applications (kind, status, created_at DESC);

CREATE TABLE IF NOT EXISTS application_notes (
  id           bigserial PRIMARY KEY,
  reference    text        NOT NULL REFERENCES applications (reference) ON DELETE CASCADE,
  kind         text        NOT NULL CHECK (kind IN ('internal', 'public', 'applicant')),
  body         text        NOT NULL,
  author_id    uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  author_name  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_notes_ref_idx ON application_notes (reference, created_at);
