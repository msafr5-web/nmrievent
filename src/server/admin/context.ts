import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseServerEnv, type ServerEnv } from "@/lib/env";
import { hasPermission, type AnyPermission } from "@/lib/permissions";
import { site } from "@/content/site";
import { getPool } from "../db";
import type { Db } from "../db";
import { getSessionUser } from "./auth";
import { ipFromHeaders, originFromHeaders } from "./request";
import { AdminError, type AdminUser } from "./users";

export const SESSION_COOKIE = "nmr_session";

let envCache: ServerEnv | undefined;
export const serverEnv = (): ServerEnv => (envCache ??= parseServerEnv());

/** null إن لم تُضبط DATABASE_URL (لوحة التحكم تتطلب قاعدة بيانات) */
export const dbOrNull = (): Db | null => getPool(serverEnv().DATABASE_URL);

export function requireDb(): Db {
  const db = dbOrNull();
  if (!db) throw new AdminError("قاعدة البيانات غير مهيأة على هذا الخادم.", "invalid");
  return db;
}

export async function clientIp(): Promise<string | null> {
  return ipFromHeaders(await headers());
}

export async function requestOrigin(): Promise<string> {
  return originFromHeaders(await headers(), site.url);
}

/** المستخدم الحالي من ملف تعريف الارتباط (مخزَّن لكل طلب عبر React cache) */
export const currentUser = cache(async (): Promise<AdminUser | null> => {
  const db = dbOrNull();
  if (!db) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getSessionUser(db, token);
});

/** للصفحات: يحوّل غير المسجَّل إلى صفحة الدخول */
export async function requireUser(): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** للصفحات: يتحقق من الصلاحية، وإلا يعيد التوجيه إلى اللوحة مع تنبيه. يجب استدعاؤه في كل صفحة (لا يكفي الـ layout). */
export async function requirePermission(perm: AnyPermission): Promise<AdminUser> {
  const user = await requireUser();
  if (!hasPermission(user, perm)) redirect(`/admin?denied=${encodeURIComponent(perm)}`);
  return user;
}

/** لإجراءات الخادم ومسارات الـ API: يرمي AdminError بدل إعادة التوجيه */
export async function authorize(perm?: AnyPermission): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) throw new AdminError("انتهت الجلسة، سجّل الدخول مجددًا.", "forbidden");
  if (perm && !hasPermission(user, perm)) throw new AdminError("ليست لديك صلاحية لهذه العملية.", "forbidden");
  return user;
}

const secureCookie = site.url.startsWith("https://");

export async function setSessionCookie(token: string, expires: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", expires });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
