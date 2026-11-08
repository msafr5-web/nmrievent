"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError, z } from "zod";
import { galleryUpdateSchema } from "@/lib/gallery-schema";
import { applicationPermission, applicationSegment } from "@/lib/permissions";
import { APPLICATION_STATUSES } from "@/lib/applications-shared";
import { gallery as staticGallery, featuredGalleryIds, serviceGalleryIds } from "@/content/gallery";
import { logger } from "@/lib/logger";
import { addInternalNote, decideApplication, deleteApplication, getApplicationKind } from "@/server/admin/applications";
import { audit } from "@/server/admin/audit";
import { authenticate, destroySession } from "@/server/admin/auth";
import { authorize, clearSessionCookie, clientIp, dbOrNull, requestOrigin, requireDb, serverEnv, sessionToken, setSessionCookie, currentUser } from "@/server/admin/context";
import { deleteGalleryItem, seedGallery, updateGalleryItem } from "@/server/admin/gallery";
import { limiter } from "@/server/admin/limiters";
import { deleteCvFile, deleteGalleryFile, MediaError } from "@/server/admin/media";
import { revalidatePublicGallery } from "@/server/admin/revalidate";
import { acceptInvite, actorOf, AdminError, bootstrapSuperAdmin, inviteUser, issueResetLink, updateUser } from "@/server/admin/users";
import type { ActionState } from "./action-state";

const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").slice(0, max);

function fail(e: unknown): ActionState {
  if (e instanceof AdminError || e instanceof MediaError) return { error: e.message };
  if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "بيانات غير صالحة." };
  logger.error({ err: e instanceof Error ? e.message : String(e) }, "admin action failed");
  return { error: "حدث خطأ غير متوقع. حاول مرة أخرى." };
}

// ───────────── الدخول والخروج والإعداد ─────────────

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email", 200).trim();
  const password = str(fd, "password", 200);
  const ip = (await clientIp()) ?? "local";
  if (limiter.login.peek(ip)) return { error: "محاولات كثيرة. حاول بعد 15 دقيقة." };
  if (!email || !password) return { error: "أدخل البريد الإلكتروني وكلمة السر." };
  const db = dbOrNull();
  if (!db) return { error: "قاعدة البيانات غير مهيأة على هذا الخادم." };
  try {
    const r = await authenticate(db, email, password, { ip, userAgent: (await headers()).get("user-agent") }, serverEnv().ADMIN_SESSION_HOURS);
    if (!r.ok) {
      limiter.login.hit(ip); // نعدّ الإخفاق فقط؛ الدخول الناجح لا يستهلك الحصة
      return { error: "بيانات الدخول غير صحيحة، أو الحساب مقفل مؤقتًا." };
    }
    await setSessionCookie(r.token, r.expiresAt);
  } catch (e) {
    return fail(e);
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const db = dbOrNull();
  const user = await currentUser();
  if (db) {
    await destroySession(db, await sessionToken());
    if (user) await audit(db, actorOf(user), "auth.logout", { entity: "user", entityId: user.id, ip: await clientIp() });
  }
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function setupAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ip = (await clientIp()) ?? "local";
  if (limiter.login.peek(ip)) return { error: "محاولات كثيرة. حاول بعد 15 دقيقة." };
  const db = dbOrNull();
  if (!db) return { error: "قاعدة البيانات غير مهيأة على هذا الخادم." };
  const password = str(fd, "password", 200);
  if (password !== str(fd, "confirm", 200)) return { error: "كلمتا السر غير متطابقتين." };
  try {
    const env = serverEnv();
    const r = await bootstrapSuperAdmin(
      db,
      { email: str(fd, "email", 200), name: str(fd, "name", 120), password, token: str(fd, "token", 200) },
      { superEmail: env.SUPER_ADMIN_EMAIL, bootstrapToken: env.ADMIN_BOOTSTRAP_TOKEN },
    );
    if (!r.ok) {
      limiter.login.hit(ip);
      return { error: r.message };
    }
  } catch (e) {
    return fail(e);
  }
  redirect("/admin/login?setup=1");
}

export async function acceptInviteAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ip = (await clientIp()) ?? "local";
  if (limiter.login.peek(ip)) return { error: "محاولات كثيرة. حاول بعد 15 دقيقة." };
  const password = str(fd, "password", 200);
  if (password !== str(fd, "confirm", 200)) return { error: "كلمتا السر غير متطابقتين." };
  try {
    const r = await acceptInvite(requireDb(), str(fd, "token", 200), password, ip);
    if (!r.ok) {
      limiter.login.hit(ip);
      return { error: r.message };
    }
  } catch (e) {
    return fail(e);
  }
  redirect("/admin/login?activated=1");
}

// ───────────── المستخدمون والصلاحيات (المدير الأعلى فقط) ─────────────

const inviteSchema = z.object({ name: z.string().trim().min(2, "الاسم مطلوب").max(120), email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(160) });

export async function inviteUserAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await authorize("users.manage");
    const input = inviteSchema.parse({ name: fd.get("name"), email: fd.get("email") });
    const { token, expiresAt } = await inviteUser(requireDb(), actor, { ...input, permissions: fd.getAll("permissions").map(String) }, serverEnv().SUPER_ADMIN_EMAIL, await clientIp());
    revalidatePath("/admin/users");
    return {
      ok: true,
      message: `تم إنشاء الحساب. أرسل هذا الرابط للمستخدم ليحدد كلمة السر (صالح حتى ${expiresAt.toLocaleString("ar-SA")}):`,
      link: `${await requestOrigin()}/admin/invite/${token}`,
    };
  } catch (e) {
    return fail(e);
  }
}

export async function updateUserAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await authorize("users.manage");
    const name = str(fd, "name", 120).trim();
    if (name.length < 2) return { error: "الاسم مطلوب." };
    await updateUser(requireDb(), actor, str(fd, "userId", 60), { name, permissions: fd.getAll("permissions").map(String), active: fd.get("active") === "on" }, await clientIp());
    revalidatePath("/admin/users");
    return { ok: true, message: "تم حفظ التعديلات. أُنهيت جلسات المستخدم الحالية ليُطبَّق التغيير فورًا." };
  } catch (e) {
    return fail(e);
  }
}

export async function resetLinkAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await authorize("users.manage");
    const { token, expiresAt } = await issueResetLink(requireDb(), actor, str(fd, "userId", 60), await clientIp());
    return {
      ok: true,
      message: `رابط تعيين كلمة سر جديدة (صالح حتى ${expiresAt.toLocaleString("ar-SA")}):`,
      link: `${await requestOrigin()}/admin/invite/${token}`,
    };
  } catch (e) {
    return fail(e);
  }
}

// ───────────── معرض الصور ─────────────

export async function updateGalleryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await authorize("gallery.edit");
    const id = str(fd, "id", 60);
    const data = galleryUpdateSchema.parse({
      category: fd.get("category"),
      alt: fd.get("alt"),
      sortOrder: fd.get("sortOrder"),
      featured: fd.get("featured") ?? undefined,
      visible: fd.get("visible") ?? undefined,
      services: fd.getAll("services"),
    });
    await updateGalleryItem(requireDb(), actorOf(actor), id, data, await clientIp());
    revalidatePublicGallery();
    revalidatePath("/admin/gallery");
    return { ok: true, message: "تم حفظ التعديلات، وستظهر على الموقع خلال لحظات." };
  } catch (e) {
    return fail(e);
  }
}

/** إظهار/إخفاء سريع من القائمة */
export async function toggleGalleryVisibleAction(fd: FormData): Promise<void> {
  const actor = await authorize("gallery.edit");
  const db = requireDb();
  const id = str(fd, "id", 60);
  await updateGalleryItem(db, actorOf(actor), id, { visible: fd.get("visible") === "true" }, await clientIp());
  revalidatePublicGallery();
  revalidatePath("/admin/gallery");
}

export async function deleteGalleryAction(fd: FormData): Promise<void> {
  const actor = await authorize("gallery.delete");
  const removed = await deleteGalleryItem(requireDb(), actorOf(actor), str(fd, "id", 60), await clientIp());
  if (removed.source === "upload") await deleteGalleryFile(serverEnv().UPLOAD_DIR, removed.src);
  revalidatePublicGallery();
  redirect("/admin/gallery");
}

/** استيراد الصور المضمّنة حاليًا في الموقع إلى القاعدة لتصبح قابلة للإدارة (مرة واحدة، آمن للتكرار) */
export async function seedGalleryAction(): Promise<void> {
  const actor = await authorize("gallery.create");
  const seed = staticGallery.map((g) => ({
    id: g.id,
    category: g.category,
    alt: g.alt,
    src: g.src,
    width: g.width,
    height: g.height,
    featured: featuredGalleryIds.includes(g.id),
    services: Object.entries(serviceGalleryIds).filter(([, ids]) => ids.includes(g.id)).map(([slug]) => slug),
  }));
  await seedGallery(requireDb(), actorOf(actor), seed);
  revalidatePublicGallery();
  revalidatePath("/admin/gallery");
}

// ───────────── طلبات التقديم ─────────────

async function guardApplication(ref: string, action: "review" | "delete") {
  const db = requireDb();
  const kind = await getApplicationKind(db, ref);
  if (!kind) throw new AdminError("الطلب غير موجود.", "not-found");
  const user = await authorize(applicationPermission(kind, action));
  return { db, kind, user };
}

export async function decideAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ref = str(fd, "ref", 40);
    const { db, kind, user } = await guardApplication(ref, "review");
    const status = str(fd, "status", 20);
    if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) return { error: "اختر حالة صالحة." };
    await decideApplication(db, { ...actorOf(user), name: user.name }, ref, { status: status as (typeof APPLICATION_STATUSES)[number], publicNote: str(fd, "publicNote", 2100), internalNote: str(fd, "internalNote", 2100) }, await clientIp());
    revalidatePath(`/admin/${applicationSegment(kind)}`);
    revalidatePath(`/admin/${applicationSegment(kind)}/${ref}`);
    revalidatePath("/admin");
    return { ok: true, message: "تم حفظ القرار." };
  } catch (e) {
    return fail(e);
  }
}

export async function noteAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ref = str(fd, "ref", 40);
    const { db, kind, user } = await guardApplication(ref, "review");
    await addInternalNote(db, { ...actorOf(user), name: user.name }, ref, str(fd, "body", 2100), await clientIp());
    revalidatePath(`/admin/${applicationSegment(kind)}/${ref}`);
    return { ok: true, message: "أُضيفت الملاحظة الداخلية." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteApplicationAction(fd: FormData): Promise<void> {
  const ref = str(fd, "ref", 40);
  const { db, kind, user } = await guardApplication(ref, "delete");
  const { attachment } = await deleteApplication(db, actorOf(user), ref, await clientIp());
  await deleteCvFile(serverEnv().UPLOAD_DIR, attachment);
  revalidatePath("/admin");
  redirect(`/admin/${applicationSegment(kind)}`);
}
