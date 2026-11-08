import { APPLICATION_STATUSES, statusLabels, type ApplicationKind, type ApplicationStatus } from "@/lib/applications-shared";
import { normalizeSaudiPhone } from "@/lib/applications";
import type { Db } from "../db";
import { audit, type Actor, SYSTEM_ACTOR } from "./audit";
import { AdminError } from "./users";

export type ApplicationRecord = {
  reference: string;
  kind: ApplicationKind;
  name: string;
  phone: string;
  email: string;
  org: string | null;
  summary: string | null;
  payload: Record<string, unknown>;
  status: ApplicationStatus;
  attachment: string | null;
  consentAt: Date;
  policyVersion: string;
  reviewedAt: Date | null;
  reviewedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationNote = { id: number; kind: "internal" | "public" | "applicant"; body: string; authorName: string | null; createdAt: Date };

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const COLS = `a.reference, a.kind, a.applicant_name, a.applicant_phone, a.applicant_email, a.applicant_org, a.summary, a.payload,
  a.status, a.attachment, a.consent_at, a.policy_version, a.reviewed_at, a.created_at, a.updated_at, u.name AS reviewed_by_name`;
const FROM = `applications a LEFT JOIN admin_users u ON u.id = a.reviewed_by`;

const map = (r: Row): ApplicationRecord => ({
  reference: r.reference,
  kind: r.kind,
  name: r.applicant_name,
  phone: r.applicant_phone,
  email: r.applicant_email,
  org: r.applicant_org,
  summary: r.summary,
  payload: r.payload ?? {},
  status: r.status,
  attachment: r.attachment,
  consentAt: r.consent_at,
  policyVersion: r.policy_version,
  reviewedAt: r.reviewed_at,
  reviewedByName: r.reviewed_by_name,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export type NewApplication = {
  reference: string;
  kind: ApplicationKind;
  name: string;
  phone: string;
  email: string;
  org?: string | null;
  summary?: string | null;
  payload: Record<string, unknown>;
  attachment?: string | null;
  policyVersion: string;
};

export async function createApplication(db: Db, input: NewApplication): Promise<void> {
  await db.query(
    `INSERT INTO applications (reference, kind, applicant_name, applicant_phone, applicant_email, applicant_org, summary, payload, attachment, consent_at, policy_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, now(), $10)`,
    [input.reference, input.kind, input.name, input.phone, input.email, input.org ?? null, input.summary ?? null, JSON.stringify(input.payload), input.attachment ?? null, input.policyVersion],
  );
}

export type ApplicationFilters = { kind: ApplicationKind; status?: ApplicationStatus; q?: string; page?: number; pageSize?: number };

const likeEscape = (s: string) => s.replace(/[%_\\]/g, "\\$&");

export async function listApplications(db: Db, f: ApplicationFilters): Promise<{ rows: ApplicationRecord[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(Math.max(f.pageSize ?? 20, 1), 100);
  const page = Math.max(f.page ?? 1, 1);
  const where = ["a.kind = $1"];
  const params: unknown[] = [f.kind];
  if (f.status) where.push(`a.status = $${params.push(f.status)}`);
  if (f.q?.trim()) {
    const p = params.push(`%${likeEscape(f.q.trim())}%`);
    where.push(`(a.applicant_name ILIKE $${p} OR a.applicant_phone ILIKE $${p} OR a.applicant_email ILIKE $${p} OR a.reference ILIKE $${p} OR a.applicant_org ILIKE $${p})`);
  }
  const w = where.join(" AND ");
  const total = await db.query(`SELECT count(*)::int AS n FROM applications a WHERE ${w}`, params);
  const { rows } = await db.query(
    `SELECT ${COLS} FROM ${FROM} WHERE ${w} ORDER BY (a.status IN ('new','needs_info')) DESC, a.created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    params,
  );
  return { rows: rows.map(map), total: total.rows[0].n, page, pageSize };
}

export async function getApplication(db: Db, reference: string): Promise<{ application: ApplicationRecord; notes: ApplicationNote[] } | null> {
  const { rows } = await db.query(`SELECT ${COLS} FROM ${FROM} WHERE a.reference = $1`, [reference]);
  if (!rows[0]) return null;
  const notes = await db.query(`SELECT id, kind, body, author_name, created_at FROM application_notes WHERE reference = $1 ORDER BY created_at, id`, [reference]);
  return {
    application: map(rows[0]),
    notes: notes.rows.map((n) => ({ id: Number(n.id), kind: n.kind, body: n.body, authorName: n.author_name, createdAt: n.created_at })),
  };
}

export type Decision = { status: ApplicationStatus; publicNote?: string; internalNote?: string };

/** قرار المراجع: تغيير الحالة مع ملاحظة تظهر للمتقدم (عامة) و/أو ملاحظة داخلية. طلب الاستكمال يستلزم ملاحظة عامة. */
export async function decideApplication(
  db: Db,
  actor: Actor & { name?: string },
  reference: string,
  d: Decision,
  ip?: string | null,
): Promise<ApplicationRecord> {
  if (!APPLICATION_STATUSES.includes(d.status)) throw new AdminError("حالة غير صالحة.", "invalid");
  const publicNote = d.publicNote?.trim() ?? "";
  const internalNote = d.internalNote?.trim() ?? "";
  if (d.status === "needs_info" && publicNote.length < 5) throw new AdminError("اكتب الملاحظات المطلوب إرسالها للمتقدم.", "invalid");
  if (publicNote.length > 2000 || internalNote.length > 2000) throw new AdminError("النص طويل جدًا.", "invalid");

  const res = await db.query(
    `UPDATE applications SET status = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now() WHERE reference = $1 RETURNING reference`,
    [reference, d.status, actor.id],
  );
  if (!res.rows[0]) throw new AdminError("الطلب غير موجود.", "not-found");
  if (publicNote) {
    await db.query(`INSERT INTO application_notes (reference, kind, body, author_id, author_name) VALUES ($1, 'public', $2, $3, $4)`, [reference, publicNote, actor.id, actor.name ?? actor.email]);
  }
  if (internalNote) {
    await db.query(`INSERT INTO application_notes (reference, kind, body, author_id, author_name) VALUES ($1, 'internal', $2, $3, $4)`, [reference, internalNote, actor.id, actor.name ?? actor.email]);
  }
  await audit(db, actor, "application.decision", {
    entity: "application",
    entityId: reference,
    details: { status: d.status, label: statusLabels[d.status], publicNote: Boolean(publicNote), internalNote: Boolean(internalNote) },
    ip,
  });
  const detail = await getApplication(db, reference);
  return detail!.application;
}

export async function addInternalNote(db: Db, actor: Actor & { name?: string }, reference: string, body: string, ip?: string | null): Promise<void> {
  const text = body.trim();
  if (text.length < 2 || text.length > 2000) throw new AdminError("الملاحظة بين حرفين و2000 حرف.", "invalid");
  const exists = await db.query(`SELECT 1 FROM applications WHERE reference = $1`, [reference]);
  if (!exists.rows[0]) throw new AdminError("الطلب غير موجود.", "not-found");
  await db.query(`INSERT INTO application_notes (reference, kind, body, author_id, author_name) VALUES ($1, 'internal', $2, $3, $4)`, [reference, text, actor.id, actor.name ?? actor.email]);
  await audit(db, actor, "application.note", { entity: "application", entityId: reference, ip });
}

/** يعيد مسار المرفق ليحذفه المستدعي من التخزين */
export async function deleteApplication(db: Db, actor: Actor, reference: string, ip?: string | null): Promise<{ attachment: string | null }> {
  const { rows } = await db.query(`DELETE FROM applications WHERE reference = $1 RETURNING attachment, kind`, [reference]);
  if (!rows[0]) throw new AdminError("الطلب غير موجود.", "not-found");
  await audit(db, actor, "application.delete", { entity: "application", entityId: reference, details: { kind: rows[0].kind }, ip });
  return { attachment: rows[0].attachment };
}

export type PublicStatus = {
  reference: string;
  kind: ApplicationKind;
  name: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
  notes: { kind: "public" | "applicant"; body: string; createdAt: Date }[];
};

/** صفحة المتابعة العامة: تتطلب رقم الطلب + رقم الجوال المسجَّل؛ ولا تُعيد الملاحظات الداخلية أبدًا */
export async function publicStatus(db: Db, reference: string, phone: string): Promise<PublicStatus | null> {
  const norm = normalizeSaudiPhone(phone);
  if (!norm) return null;
  const { rows } = await db.query(
    `SELECT reference, kind, applicant_name, status, created_at, updated_at FROM applications WHERE reference = $1 AND applicant_phone = $2`,
    [reference.trim().toUpperCase(), norm],
  );
  if (!rows[0]) return null;
  const notes = await db.query(
    `SELECT kind, body, created_at FROM application_notes WHERE reference = $1 AND kind IN ('public', 'applicant') ORDER BY created_at, id`,
    [rows[0].reference],
  );
  return {
    reference: rows[0].reference,
    kind: rows[0].kind,
    name: rows[0].applicant_name,
    status: rows[0].status,
    createdAt: rows[0].created_at,
    updatedAt: rows[0].updated_at,
    notes: notes.rows.map((n) => ({ kind: n.kind, body: n.body, createdAt: n.created_at })),
  };
}

/** رد المتقدم على طلب الاستكمال: يُسجَّل كملاحظة ويعود الطلب إلى "قيد المراجعة" */
export async function applicantReply(db: Db, reference: string, phone: string, message: string): Promise<boolean> {
  const current = await publicStatus(db, reference, phone);
  if (!current || current.status !== "needs_info") return false;
  await db.query(`INSERT INTO application_notes (reference, kind, body, author_name) VALUES ($1, 'applicant', $2, $3)`, [current.reference, message.trim(), current.name]);
  await db.query(`UPDATE applications SET status = 'under_review', updated_at = now() WHERE reference = $1`, [current.reference]);
  return true;
}

export type ApplicationCounts = Record<ApplicationKind, Record<ApplicationStatus, number> & { total: number }>;

export async function applicationCounts(db: Db): Promise<ApplicationCounts> {
  const empty = () => ({ total: 0, ...Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) }) as ApplicationCounts["staff"];
  const out: ApplicationCounts = { staff: empty(), exhibition: empty() };
  const { rows } = await db.query(`SELECT kind, status, count(*)::int AS n FROM applications GROUP BY kind, status`);
  for (const r of rows) {
    out[r.kind as ApplicationKind][r.status as ApplicationStatus] = r.n;
    out[r.kind as ApplicationKind].total += r.n;
  }
  return out;
}

/** سياسة الاحتفاظ: يحذف الطلبات المرفوضة الأقدم من المدة ويعيد مسارات مرفقاتها للحذف من التخزين */
export async function purgeRejectedApplications(db: Db, days: number): Promise<{ deleted: number; attachments: string[] }> {
  const { rows } = await db.query(
    `DELETE FROM applications WHERE status = 'rejected' AND updated_at < now() - make_interval(days => $1::int) RETURNING attachment`,
    [days],
  );
  if (rows.length) await audit(db, SYSTEM_ACTOR, "application.purge", { entity: "application", details: { deleted: rows.length, olderThanDays: days } });
  return { deleted: rows.length, attachments: rows.map((r) => r.attachment).filter(Boolean) };
}

/** طلبات عروض الأسعار (RFQ) المحفوظة سابقًا في rfq_leads — عرض فقط */
export type RfqLeadRow = { reference: string; status: string; createdAt: Date; payload: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function listRfqLeads(db: Db, opts: { page?: number; pageSize?: number; q?: string } = {}): Promise<{ rows: RfqLeadRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
  const page = Math.max(opts.page ?? 1, 1);
  const params: unknown[] = [];
  let where = "";
  if (opts.q?.trim()) {
    const p = params.push(`%${likeEscape(opts.q.trim())}%`);
    where = `WHERE reference ILIKE $${p} OR payload->>'organization' ILIKE $${p} OR payload->>'name' ILIKE $${p} OR payload->>'email' ILIKE $${p}`;
  }
  const total = await db.query(`SELECT count(*)::int AS n FROM rfq_leads ${where}`, params);
  const { rows } = await db.query(
    `SELECT reference, status, created_at, payload FROM rfq_leads ${where} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    params,
  );
  return { rows: rows.map((r) => ({ reference: r.reference, status: r.status, createdAt: r.created_at, payload: r.payload })), total: total.rows[0].n, page, pageSize };
}

export async function getApplicationKind(db: Db, reference: string): Promise<ApplicationKind | null> {
  const { rows } = await db.query(`SELECT kind FROM applications WHERE reference = $1`, [reference]);
  return rows[0]?.kind ?? null;
}
