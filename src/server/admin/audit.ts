import type { Db } from "../db";

export type Actor = { id: string | null; email: string | null };
export const SYSTEM_ACTOR: Actor = { id: null, email: "system" };

export type AuditEntry = {
  id: number;
  at: Date;
  actorEmail: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: Record<string, unknown>;
  ip: string | null;
};

/**
 * سجل النشاط: من فعل ماذا ومتى. لا تُسجَّل فيه كلمات السر أو الرموز أو نصوص حساسة؛
 * فقط معرّفات وقيم وصفية (مثل الحالة الجديدة أو قائمة الصلاحيات).
 */
export async function audit(
  db: Db,
  actor: Actor,
  action: string,
  opts: { entity?: string; entityId?: string; details?: Record<string, unknown>; ip?: string | null } = {},
): Promise<void> {
  await db.query(
    `INSERT INTO audit_log (actor_id, actor_email, action, entity, entity_id, details, ip)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [actor.id, actor.email, action, opts.entity ?? null, opts.entityId ?? null, JSON.stringify(opts.details ?? {}), opts.ip ?? null],
  );
}

export async function listAudit(db: Db, opts: { limit?: number; offset?: number; action?: string } = {}): Promise<{ rows: AuditEntry[]; total: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const filter = opts.action ? "WHERE action LIKE $3" : "";
  const params: unknown[] = [limit, offset];
  if (opts.action) params.push(`${opts.action.replace(/[%_]/g, "")}%`);
  const rows = await db.query(
    `SELECT id, at, actor_email, action, entity, entity_id, details, ip FROM audit_log ${filter} ORDER BY at DESC, id DESC LIMIT $1 OFFSET $2`,
    params,
  );
  const total = await db.query(`SELECT count(*)::int AS n FROM audit_log ${opts.action ? "WHERE action LIKE $1" : ""}`, opts.action ? [params[2]] : []);
  return {
    rows: rows.rows.map((r) => ({
      id: Number(r.id),
      at: r.at,
      actorEmail: r.actor_email,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id,
      details: r.details ?? {},
      ip: r.ip,
    })),
    total: total.rows[0].n,
  };
}

const actionLabels: Record<string, string> = {
  "auth.login": "تسجيل دخول",
  "auth.login_failed": "محاولة دخول فاشلة",
  "auth.logout": "تسجيل خروج",
  "auth.setup": "إنشاء حساب المدير الأعلى",
  "auth.invite_accepted": "تفعيل حساب من دعوة",
  "user.invite": "دعوة مستخدم",
  "user.update": "تعديل مستخدم",
  "user.reset_link": "إصدار رابط إعادة تعيين كلمة السر",
  "gallery.create": "إضافة صورة",
  "gallery.update": "تعديل صورة",
  "gallery.delete": "حذف صورة",
  "gallery.seed": "استيراد صور الموقع الحالية",
  "application.view": "فتح طلب تقديم",
  "application.decision": "قرار على طلب",
  "application.note": "ملاحظة داخلية",
  "application.delete": "حذف طلب",
  "application.cv_download": "تنزيل سيرة ذاتية",
  "application.purge": "حذف تلقائي للطلبات المنتهية",
};
export const auditLabel = (a: string) => actionLabels[a] ?? a;
