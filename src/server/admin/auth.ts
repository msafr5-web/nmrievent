import { dummyHash, verifyPassword } from "@/lib/password";
import { hashToken, newToken } from "@/lib/tokens";
import type { Db } from "../db";
import { audit } from "./audit";
import { actorOf, findUserByEmail, mapUser, USER_COLUMNS, type AdminUser } from "./users";

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
/** مهلة الخمول: تنتهي الجلسة إن لم يُستخدم الحساب خلال هذه المدة */
export const IDLE_MINUTES = 120;

export type SessionContext = { ip?: string | null; userAgent?: string | null };

export async function createSession(db: Db, userId: string, ctx: SessionContext, hours: number): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const { rows } = await db.query(
    `INSERT INTO admin_sessions (token_hash, user_id, expires_at, ip, user_agent)
     VALUES ($1, $2, now() + make_interval(hours => $3::int), $4, left($5, 300)) RETURNING expires_at`,
    [hashToken(token), userId, hours, ctx.ip ?? null, ctx.userAgent ?? null],
  );
  // تنظيف انتهازي للجلسات المنتهية
  await db.query(`DELETE FROM admin_sessions WHERE expires_at < now() - interval '1 day'`);
  return { token, expiresAt: rows[0].expires_at };
}

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; user: AdminUser }
  | { ok: false; reason: "invalid" };

/**
 * تسجيل الدخول بالبريد وكلمة السر. الرد عن أي فشل واحد ("invalid") حتى لا يُكشف وجود الحساب،
 * ويُنفَّذ اشتقاق كلمة سر وهمي عند غياب الحساب لتساوي الأزمنة. بعد 5 محاولات خاطئة يُقفل الحساب 15 دقيقة.
 */
export async function authenticate(db: Db, email: string, password: string, ctx: SessionContext, sessionHours: number): Promise<LoginResult> {
  const user = await findUserByEmail(db, email);
  const bad = async (userId?: string): Promise<LoginResult> => {
    await audit(db, { id: userId ?? null, email: userId ? email.trim().toLowerCase() : null }, "auth.login_failed", {
      entity: userId ? "user" : undefined,
      entityId: userId,
      ip: ctx.ip,
    });
    return { ok: false, reason: "invalid" };
  };

  if (!user) {
    await verifyPassword(password, await dummyHash());
    return bad();
  }
  const locked = user.lockedUntil !== null && user.lockedUntil > new Date();
  const valid = await verifyPassword(password, user.passwordHash);
  if (locked || !user.active || !valid) {
    if (!locked && user.active && user.passwordHash) {
      await db.query(
        `UPDATE admin_users SET failed_logins = failed_logins + 1,
           locked_until = CASE WHEN failed_logins + 1 >= $2 THEN now() + make_interval(mins => $3::int) ELSE locked_until END
         WHERE id = $1`,
        [user.id, MAX_FAILED_LOGINS, LOCK_MINUTES],
      );
    }
    return bad(user.id);
  }

  await db.query(`UPDATE admin_users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = $1`, [user.id]);
  const session = await createSession(db, user.id, ctx, sessionHours);
  await audit(db, actorOf(user), "auth.login", { entity: "user", entityId: user.id, ip: ctx.ip });
  return { ok: true, ...session, user };
}

/** المستخدم صاحب الجلسة الصالحة (غير منتهية، غير خاملة، والحساب نشط) أو null */
export async function getSessionUser(db: Db, token: string | undefined | null): Promise<AdminUser | null> {
  if (!token) return null;
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS.split(", ").map((c) => `u.${c}`).join(", ")}, s.last_seen_at
       FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()
        AND s.last_seen_at > now() - make_interval(mins => $2::int) AND u.active`,
    [hashToken(token), IDLE_MINUTES],
  );
  if (!rows[0]) return null;
  // تحديث آخر نشاط بحد أقصى مرة في الدقيقة
  if (Date.now() - new Date(rows[0].last_seen_at).getTime() > 60_000) {
    await db.query(`UPDATE admin_sessions SET last_seen_at = now() WHERE token_hash = $1`, [hashToken(token)]);
  }
  return mapUser(rows[0]);
}

export async function destroySession(db: Db, token: string | undefined | null): Promise<void> {
  if (token) await db.query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [hashToken(token)]);
}
