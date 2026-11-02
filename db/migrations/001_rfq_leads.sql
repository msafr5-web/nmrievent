CREATE TABLE IF NOT EXISTS rfq_leads (
  reference       text PRIMARY KEY,
  payload         jsonb       NOT NULL,
  -- stored: محفوظ بدون وجهة تسليم | pending: بانتظار التسليم | delivered | failed: استنفد المحاولات
  status          text        NOT NULL CHECK (status IN ('stored', 'pending', 'delivered', 'failed')),
  attempts        integer     NOT NULL DEFAULT 0,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  delivered_at    timestamptz
);
CREATE INDEX IF NOT EXISTS rfq_leads_pending_idx ON rfq_leads (next_attempt_at) WHERE status = 'pending';
