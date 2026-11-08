import { checkPassword, hashPassword, passwordIssueMessage } from "@/lib/password";
import { sanitizePermissions, type Permission } from "@/lib/permissions";
import { hashToken, newToken, safeEqual } from "@/lib/tokens";
import type { Db } from "../db";
import { audit, type Actor } from "./audit";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  isSuper: boolean;
  permissions: Permission[];
  active: boolean;
  hasPassword: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const mapUser = (r: Row): AdminUser => ({
  id: r.id,
  email: r.email,
  name: r.name,
  isSuper: r.is_super,
  permissions: sanitizePermissions(r.permissions ?? []),
  active: r.active,
  hasPassword: Boolean(r.password_hash),
  createdAt: r.created_at,
  lastLoginAt: r.last_login_at,
});

export const USER_COLUMNS = "id, email, name, is_super, permissions, active, password_hash, created_at, last_login_at";
export const INVITE_HOURS = 72;

export const actorOf = (u: AdminUser): Actor => ({ id: u.id, email: u.email });
const normEmail = (e: string) => e.trim().toLowerCase();

export async function findUserByEmail(db: Db, email: string): Promise<(AdminUser & { passwordHash: string | null; failedLogins: number; lockedUntil: Date | null }) | null> {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS}, failed_logins, locked_until FROM admin_users WHERE lower(email) = $1`, [normEmail(email)]);
  if (!rows[0]) return null;
  return { ...mapUser(rows[0]), passwordHash: rows[0].password_hash, failedLogins: rows[0].failed_logins, lockedUntil: rows[0].locked_until };
}

export async function getUser(db: Db, id: string): Promise<AdminUser | null> {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM admin_users WHERE id = $1`, [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function listUsers(db: Db): Promise<AdminUser[]> {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM admin_users ORDER BY is_super DESC, created_at`);
  return rows.map(mapUser);
}

export async function hasSuperAdmin(db: Db): Promise<boolean> {
  const { rows } = await db.query(`SELECT 1 FROM admin_users WHERE is_super LIMIT 1`);
  return rows.length > 0;
}

export type BootstrapError = "disabled" | "exists" | "invalid-token" | "email-mismatch" | "weak-password";

/**
 * إنشاء حساب المدير الأعلى مرة واحدة: يتطلب رمز الإعداد السري (ADMIN_BOOTSTRAP_TOKEN) من ملف الأسرار،
 * والبريد يجب أن يطابق SUPER_ADMIN_EMAIL. بعد وجود مدير أعلى يُغلق المسار نهائيًا.
 */
export async function bootstrapSuperAdmin(
  db: Db,
  input: { email: string; name: string; password: string; token: string },
  cfg: { superEmail: string; bootstrapToken: string | undefined },
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: BootstrapError; message: string }> {
  const fail = (error: BootstrapError, message: string) => ({ ok: false as const, error, message });
  if (!cfg.bootstrapToken) return fail("disabled", "الإعداد الأولي غير مفعّل على هذا الخادم.");
  if (await hasSuperAdmin(db)) return fail("exists", "تم إنشاء المدير الأعلى مسبقًا.");
  if (!safeEqual(input.token.trim(), cfg.bootstrapToken)) return fail("invalid-token", "رمز الإعداد غير صحيح.");
  if (normEmail(input.email) !== normEmail(cfg.superEmail)) return fail("email-mismatch", "هذا البريد غير مخوَّل ليكون المدير الأعلى.");
  const issue = checkPassword(input.password, input.email);
  if (issue) return fail("weak-password", passwordIssueMessage[issue]);

  const hash = await hashPassword(input.password);
  const { rows } = await db.query(
    `INSERT INTO admin_users (email, name, password_hash, is_super, permissions) VALUES ($1, $2, $3, true, '{}')
     ON CONFLICT DO NOTHING RETURNING ${USER_COLUMNS}`,
    [normEmail(input.email), input.name.trim() || "المدير الأعلى", hash],
  );
  if (!rows[0]) return fail("exists", "تم إنشاء المدير الأعلى مسبقًا.");
  const user = mapUser(rows[0]);
  await audit(db, actorOf(user), "auth.setup", { entity: "user", entityId: user.id });
  return { ok: true, user };
}

export class AdminError extends Error {
  constructor(message: string, readonly code: "forbidden" | "conflict" | "not-found" | "invalid") {
    super(message);
    this.name = "AdminError";
  }
}

function requireSuper(actor: AdminUser) {
  if (!actor.isSuper) throw new AdminError("هذه العملية للمدير الأعلى فقط.", "forbidden");
}

/** يُنشئ رمز دعوة/إعادة تعيين (يُعاد النص الخام مرة واحدة فقط، والمخزَّن SHA-256) */
async function issueToken(db: Db, userId: string, kind: "invite" | "reset", createdBy: string | null): Promise<{ token: string; expiresAt: Date }> {
  await db.query(`DELETE FROM admin_invites WHERE user_id = $1 AND used_at IS NULL`, [userId]);
  const token = newToken();
  const { rows } = await db.query(
    `INSERT INTO admin_invites (token_hash, user_id, kind, expires_at, created_by)
     VALUES ($1, $2, $3, now() + make_interval(hours => $4::int), $5) RETURNING expires_at`,
    [hashToken(token), userId, kind, INVITE_HOURS, createdBy],
  );
  return { token, expiresAt: rows[0].expires_at };
}

export async function inviteUser(
  db: Db,
  actor: AdminUser,
  input: { email: string; name: string; permissions: readonly string[] },
  superEmail: string,
  ip?: string | null,
): Promise<{ user: AdminUser; token: string; expiresAt: Date }> {
  requireSuper(actor);
  const email = normEmail(input.email);
  if (email === normEmail(superEmail)) throw new AdminError("هذا البريد محجوز للمدير الأعلى.", "conflict");
  const permissions = sanitizePermissions(input.permissions);
  const { rows } = await db.query(
    `INSERT INTO admin_users (email, name, permissions, created_by) VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING RETURNING ${USER_COLUMNS}`,
    [email, input.name.trim(), permissions, actor.id],
  );
  if (!rows[0]) throw new AdminError("يوجد مستخدم بهذا البريد مسبقًا.", "conflict");
  const user = mapUser(rows[0]);
  const { token, expiresAt } = await issueToken(db, user.id, "invite", actor.id);
  await audit(db, actorOf(actor), "user.invite", { entity: "user", entityId: user.id, details: { email, permissions }, ip });
  return { user, token, expiresAt };
}

export async function issueResetLink(db: Db, actor: AdminUser, userId: string, ip?: string | null) {
  requireSuper(actor);
  const target = await getUser(db, userId);
  if (!target) throw new AdminError("المستخدم غير موجود.", "not-found");
  if (target.isSuper) throw new AdminError("يُعاد تعيين كلمة سر المدير الأعلى من الخادم فقط.", "forbidden");
  const res = await issueToken(db, userId, target.hasPassword ? "reset" : "invite", actor.id);
  await audit(db, actorOf(actor), "user.reset_link", { entity: "user", entityId: userId, ip });
  return res;
}

export async function updateUser(
  db: Db,
  actor: AdminUser,
  userId: string,
  patch: { name?: string; permissions?: readonly string[]; active?: boolean },
  ip?: string | null,
): Promise<AdminUser> {
  requireSuper(actor);
  const target = await getUser(db, userId);
  if (!target) throw new AdminError("المستخدم غير موجود.", "not-found");
  if (target.isSuper) throw new AdminError("لا يمكن تعديل حساب المدير الأعلى.", "forbidden");
  if (patch.active === false && target.id === actor.id) throw new AdminError("لا يمكنك تعطيل حسابك.", "forbidden");

  const permissions = patch.permissions ? sanitizePermissions(patch.permissions) : target.permissions;
  const { rows } = await db.query(
    `UPDATE admin_users SET name = $2, permissions = $3, active = $4 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, patch.name?.trim() || target.name, permissions, patch.active ?? target.active],
  );
  if (patch.active === false || patch.permissions) {
    // تغيير الصلاحيات أو التعطيل يُسقط الجلسات القائمة فورًا
    await db.query(`DELETE FROM admin_sessions WHERE user_id = $1`, [userId]);
  }
  await audit(db, actorOf(actor), "user.update", {
    entity: "user",
    entityId: userId,
    details: { permissions, active: patch.active ?? target.active, name: patch.name?.trim() || target.name },
    ip,
  });
  return mapUser(rows[0]);
}

export type InviteInfo = { email: string; name: string; kind: "invite" | "reset" };

export async function peekInvite(db: Db, token: string): Promise<InviteInfo | null> {
  const { rows } = await db.query(
    `SELECT u.email, u.name, i.kind FROM admin_invites i JOIN admin_users u ON u.id = i.user_id
      WHERE i.token_hash = $1 AND i.used_at IS NULL AND i.expires_at > now() AND u.active AND NOT u.is_super`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function acceptInvite(
  db: Db,
  token: string,
  password: string,
  ip?: string | null,
): Promise<{ ok: true; user: AdminUser } | { ok: false; message: string }> {
  const info = await peekInvite(db, token);
  if (!info) return { ok: false, message: "الرابط غير صالح أو منتهي الصلاحية." };
  const issue = checkPassword(password, info.email);
  if (issue) return { ok: false, message: passwordIssueMessage[issue] };
  const hash = await hashPassword(password);

  // الاستهلاك ذري: يفشل إن استُخدم الرابط بالتوازي
  const used = await db.query(
    `UPDATE admin_invites SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id`,
    [hashToken(token)],
  );
  if (!used.rows[0]) return { ok: false, message: "الرابط غير صالح أو منتهي الصلاحية." };
  const { rows } = await db.query(
    `UPDATE admin_users SET password_hash = $2, failed_logins = 0, locked_until = NULL WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [used.rows[0].user_id, hash],
  );
  await db.query(`DELETE FROM admin_sessions WHERE user_id = $1`, [used.rows[0].user_id]);
  const user = mapUser(rows[0]);
  await audit(db, actorOf(user), "auth.invite_accepted", { entity: "user", entityId: user.id, ip });
  return { ok: true, user };
}
