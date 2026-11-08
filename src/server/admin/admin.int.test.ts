/**
 * اختبارات تكامل لوحة التحكم على PostgreSQL حقيقي (embedded-postgres) — `npm run test:db`.
 * تطبّق ملفات الـ migration الفعلية وتختبر المصادقة والصلاحيات والمعرض وطلبات التقديم والتدقيق.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { referenceNumber } from "@/lib/rfq-shared";
import { listAudit } from "./audit";
import { applicantReply, applicationCounts, createApplication, decideApplication, deleteApplication, getApplication, listApplications, listRfqLeads, publicStatus, purgeRejectedApplications, addInternalNote } from "./applications";
import { authenticate, createSession, destroySession, getSessionUser, LOCK_MINUTES, MAX_FAILED_LOGINS } from "./auth";
import { countGallery, createGalleryItem, deleteGalleryItem, listGallery, seedGallery, updateGalleryItem } from "./gallery";
import { acceptInvite, AdminError, bootstrapSuperAdmin, findUserByEmail, inviteUser, issueResetLink, listUsers, peekInvite, updateUser, actorOf, type AdminUser } from "./users";

const PORT = 54_900 + Math.floor(Math.random() * 400);
const dir = mkdtempSync(join(tmpdir(), "nmr-admin-pg-"));
const server = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "pw", port: PORT, persistent: false, initdbFlags: ["--encoding=UTF8", "--locale=C"] });
let pool: Pool;

const SUPER = "msafr.5@gmail.com";
const PASSWORD = "Super-Admin-Pass-2026";
const cfg = { superEmail: SUPER, bootstrapToken: "bootstrap-token-0123456789abcdef" };
const ctx = { ip: "10.0.0.1", userAgent: "vitest" };

beforeAll(async () => {
  await server.initialise();
  await server.start();
  await server.createDatabase("nmr");
  pool = new Pool({ connectionString: `postgres://postgres:pw@localhost:${PORT}/nmr`, max: 8 });
  const migrations = join(process.cwd(), "db", "migrations");
  for (const f of readdirSync(migrations).filter((x) => x.endsWith(".sql")).sort()) await pool.query(readFileSync(join(migrations, f), "utf8"));
}, 120_000);

afterAll(async () => {
  await pool?.end();
  await server.stop();
  rmSync(dir, { recursive: true, force: true });
}, 60_000);

beforeEach(async () => {
  await pool.query("TRUNCATE application_notes, applications, gallery_items, audit_log, admin_invites, admin_sessions, admin_users CASCADE");
});

async function makeSuper(): Promise<AdminUser> {
  const r = await bootstrapSuperAdmin(pool, { email: SUPER, name: "المدير", password: PASSWORD, token: cfg.bootstrapToken }, cfg);
  if (!r.ok) throw new Error(r.message);
  return r.user;
}

async function makeUser(su: AdminUser, email: string, permissions: string[]): Promise<AdminUser> {
  const { user, token } = await inviteUser(pool, su, { email, name: "مستخدم", permissions }, SUPER);
  const r = await acceptInvite(pool, token, "User-Password-2026");
  if (!r.ok) throw new Error(r.message);
  return { ...user, hasPassword: true };
}

describe("إعداد المدير الأعلى (bootstrap)", () => {
  it("يعمل مرة واحدة بالرمز الصحيح والبريد المخوَّل", async () => {
    const r = await makeSuper();
    expect(r).toMatchObject({ email: SUPER, isSuper: true, active: true, hasPassword: true });
    const again = await bootstrapSuperAdmin(pool, { email: SUPER, name: "x", password: PASSWORD, token: cfg.bootstrapToken }, cfg);
    expect(again).toMatchObject({ ok: false, error: "exists" });
  });

  it.each([
    ["رمز خاطئ", { token: "wrong-token-wrong-token-wrong" }, "invalid-token"],
    ["بريد غير مخوَّل", { email: "attacker@example.com" }, "email-mismatch"],
    ["كلمة سر ضعيفة", { password: "weak" }, "weak-password"],
  ])("يرفض: %s", async (_n, over, error) => {
    const r = await bootstrapSuperAdmin(pool, { email: SUPER, name: "x", password: PASSWORD, token: cfg.bootstrapToken, ...over }, cfg);
    expect(r).toMatchObject({ ok: false, error });
    expect((await listUsers(pool)).length).toBe(0);
  });

  it("معطّل إن لم يُضبط الرمز في البيئة", async () => {
    const r = await bootstrapSuperAdmin(pool, { email: SUPER, name: "x", password: PASSWORD, token: "anything-anything-anything-12" }, { superEmail: SUPER, bootstrapToken: undefined });
    expect(r).toMatchObject({ ok: false, error: "disabled" });
  });

  it("البريد غير حساس لحالة الأحرف ولا يوجد إلا مدير أعلى واحد (قيد قاعدة البيانات)", async () => {
    await bootstrapSuperAdmin(pool, { email: "MSAFR.5@GMAIL.COM", name: "x", password: PASSWORD, token: cfg.bootstrapToken }, cfg);
    expect((await findUserByEmail(pool, SUPER))?.isSuper).toBe(true);
    await expect(pool.query(`INSERT INTO admin_users (email, name, is_super) VALUES ('other@example.com','x',true)`)).rejects.toThrow();
  });
});

describe("تسجيل الدخول والجلسات", () => {
  it("دخول صحيح ينشئ جلسة، والخاطئ يرد بنفس النتيجة سواء وُجد الحساب أم لا", async () => {
    await makeSuper();
    const ok = await authenticate(pool, SUPER.toUpperCase(), PASSWORD, ctx, 12);
    expect(ok.ok).toBe(true);
    expect(await authenticate(pool, SUPER, "Wrong-Password-1234", ctx, 12)).toEqual({ ok: false, reason: "invalid" });
    expect(await authenticate(pool, "nobody@example.com", PASSWORD, ctx, 12)).toEqual({ ok: false, reason: "invalid" });
  });

  it("الرمز الخام لا يُخزَّن (SHA-256 فقط) والجلسة تعيد المستخدم وتُحذف عند الخروج", async () => {
    await makeSuper();
    const r = await authenticate(pool, SUPER, PASSWORD, ctx, 12);
    if (!r.ok) throw new Error("login failed");
    const stored = (await pool.query("SELECT token_hash FROM admin_sessions")).rows[0].token_hash;
    expect(stored).not.toBe(r.token);
    expect(stored).toHaveLength(64);
    expect((await getSessionUser(pool, r.token))?.email).toBe(SUPER);
    await destroySession(pool, r.token);
    expect(await getSessionUser(pool, r.token)).toBeNull();
    expect(await getSessionUser(pool, undefined)).toBeNull();
    expect(await getSessionUser(pool, "forged-token")).toBeNull();
  });

  it(`يُقفل الحساب بعد ${MAX_FAILED_LOGINS} محاولات خاطئة حتى مع كلمة السر الصحيحة`, async () => {
    await makeSuper();
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) await authenticate(pool, SUPER, "Wrong-Password-1234", ctx, 12);
    expect(await authenticate(pool, SUPER, PASSWORD, ctx, 12)).toEqual({ ok: false, reason: "invalid" });
    const u = await findUserByEmail(pool, SUPER);
    expect(u!.lockedUntil!.getTime()).toBeGreaterThan(Date.now() + (LOCK_MINUTES - 1) * 60_000);
    // فتح القفل (محاكاة انتهاء المدة) يسمح بالدخول
    await pool.query("UPDATE admin_users SET locked_until = now() - interval '1 second'");
    expect((await authenticate(pool, SUPER, PASSWORD, ctx, 12)).ok).toBe(true);
    expect((await findUserByEmail(pool, SUPER))!.failedLogins).toBe(0);
  }, 30_000);

  it("الجلسة المنتهية أو الخاملة أو لحساب معطّل لا تصلح", async () => {
    const su = await makeSuper();
    const { token } = await createSession(pool, su.id, ctx, 12);
    expect(await getSessionUser(pool, token)).not.toBeNull();
    await pool.query("UPDATE admin_sessions SET last_seen_at = now() - interval '3 hours'");
    expect(await getSessionUser(pool, token)).toBeNull(); // خمول > 120 دقيقة
    await pool.query("UPDATE admin_sessions SET last_seen_at = now(), expires_at = now() - interval '1 minute'");
    expect(await getSessionUser(pool, token)).toBeNull(); // منتهية
    const u = await makeUser(su, "emp@example.com", ["gallery.view"]);
    const s = await createSession(pool, u.id, ctx, 12);
    await pool.query("UPDATE admin_users SET active = false WHERE id = $1", [u.id]);
    expect(await getSessionUser(pool, s.token)).toBeNull();
  });

  it("الحساب المعطّل لا يستطيع الدخول", async () => {
    const su = await makeSuper();
    const u = await makeUser(su, "emp@example.com", ["gallery.view"]);
    expect((await authenticate(pool, "emp@example.com", "User-Password-2026", ctx, 12)).ok).toBe(true);
    await updateUser(pool, su, u.id, { active: false });
    expect((await authenticate(pool, "emp@example.com", "User-Password-2026", ctx, 12)).ok).toBe(false);
  });
});

describe("المستخدمون والدعوات والصلاحيات", () => {
  it("المدير الأعلى يدعو مستخدمًا بصلاحيات منقّاة، والدعوة تُقبل مرة واحدة", async () => {
    const su = await makeSuper();
    const { user, token } = await inviteUser(pool, su, { email: "Emp@Example.com", name: "موظفة", permissions: ["staff.review", "users.manage", "bogus"] }, SUPER);
    expect(user.permissions).toEqual(["staff.view", "staff.review"]);
    expect(user.hasPassword).toBe(false);
    expect(await peekInvite(pool, token)).toMatchObject({ email: "emp@example.com", kind: "invite" });
    expect((await authenticate(pool, "emp@example.com", "User-Password-2026", ctx, 12)).ok).toBe(false); // قبل القبول
    expect(await acceptInvite(pool, token, "weak")).toMatchObject({ ok: false });
    expect(await acceptInvite(pool, token, "User-Password-2026")).toMatchObject({ ok: true });
    expect(await acceptInvite(pool, token, "Another-Password-2026")).toMatchObject({ ok: false }); // استُهلك
    expect(await peekInvite(pool, token)).toBeNull();
    expect((await authenticate(pool, "emp@example.com", "User-Password-2026", ctx, 12)).ok).toBe(true);
  });

  it("الدعوة المنتهية أو المزوَّرة لا تعمل، وتخزَّن مجزّأة", async () => {
    const su = await makeSuper();
    const { token } = await inviteUser(pool, su, { email: "a@example.com", name: "a", permissions: [] }, SUPER);
    expect((await pool.query("SELECT token_hash FROM admin_invites")).rows[0].token_hash).not.toBe(token);
    await pool.query("UPDATE admin_invites SET expires_at = now() - interval '1 minute'");
    expect(await acceptInvite(pool, token, "User-Password-2026")).toMatchObject({ ok: false });
    expect(await acceptInvite(pool, "forged", "User-Password-2026")).toMatchObject({ ok: false });
  });

  it("غير المدير الأعلى لا يستطيع إدارة المستخدمين", async () => {
    const su = await makeSuper();
    const u = await makeUser(su, "emp@example.com", [...["gallery.view", "gallery.edit", "staff.review", "audit.view"]]);
    await expect(inviteUser(pool, u, { email: "x@example.com", name: "x", permissions: [] }, SUPER)).rejects.toMatchObject({ code: "forbidden" });
    await expect(updateUser(pool, u, su.id, { active: false })).rejects.toBeInstanceOf(AdminError);
    await expect(issueResetLink(pool, u, su.id)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("لا يمكن حجز بريد المدير الأعلى ولا تكرار بريد ولا تعديل المدير الأعلى", async () => {
    const su = await makeSuper();
    await expect(inviteUser(pool, su, { email: "MSAFR.5@gmail.com", name: "x", permissions: [] }, SUPER)).rejects.toMatchObject({ code: "conflict" });
    await inviteUser(pool, su, { email: "a@example.com", name: "a", permissions: [] }, SUPER);
    await expect(inviteUser(pool, su, { email: "A@example.com", name: "a2", permissions: [] }, SUPER)).rejects.toMatchObject({ code: "conflict" });
    await expect(updateUser(pool, su, su.id, { permissions: [] })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("تغيير الصلاحيات أو التعطيل يُسقط جلسات المستخدم فورًا", async () => {
    const su = await makeSuper();
    const u = await makeUser(su, "emp@example.com", ["gallery.view", "gallery.edit"]);
    const s = await createSession(pool, u.id, ctx, 12);
    expect((await getSessionUser(pool, s.token))?.permissions).toContain("gallery.edit");
    const updated = await updateUser(pool, su, u.id, { permissions: ["staff.view"] });
    expect(updated.permissions).toEqual(["staff.view"]);
    expect(await getSessionUser(pool, s.token)).toBeNull();
  });

  it("رابط إعادة التعيين يبدّل كلمة السر ويفتح القفل ويُسقط الجلسات", async () => {
    const su = await makeSuper();
    const u = await makeUser(su, "emp@example.com", ["gallery.view"]);
    const s = await createSession(pool, u.id, ctx, 12);
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) await authenticate(pool, "emp@example.com", "Wrong-Password-1234", ctx, 12);
    const { token } = await issueResetLink(pool, su, u.id);
    expect(await peekInvite(pool, token)).toMatchObject({ kind: "reset" });
    expect(await acceptInvite(pool, token, "Brand-New-Password-77")).toMatchObject({ ok: true });
    expect(await getSessionUser(pool, s.token)).toBeNull();
    expect((await authenticate(pool, "emp@example.com", "User-Password-2026", ctx, 12)).ok).toBe(false);
    expect((await authenticate(pool, "emp@example.com", "Brand-New-Password-77", ctx, 12)).ok).toBe(true);
  }, 30_000);

  it("المدير الأعلى لا يعطّل نفسه عبر updateUser ولا يعاد تعيين كلمة سره من اللوحة", async () => {
    const su = await makeSuper();
    await expect(issueResetLink(pool, su, su.id)).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("معرض الصور", () => {
  const seed = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `seed-${i}`, category: "booths", alt: `صورة ${i}`, src: `/images/works/booths/s${i}.webp`, width: 1000, height: 700, featured: i === 0, services: i % 2 ? ["logistics"] : [] }));

  it("الاستيراد آمن للتكرار ويحفظ الترتيب والعلامات", async () => {
    const su = await makeSuper();
    expect(await seedGallery(pool, actorOf(su), seed(5))).toBe(5);
    expect(await seedGallery(pool, actorOf(su), seed(5))).toBe(0);
    const all = await listGallery(pool);
    expect(all.map((g) => g.id)).toEqual(["seed-0", "seed-1", "seed-2", "seed-3", "seed-4"]);
    expect(all[0]).toMatchObject({ featured: true, source: "seed", visible: true });
    expect(all[1].services).toEqual(["logistics"]);
    expect(await countGallery(pool)).toEqual({ total: 5, visible: 5 });
  });

  it("الصورة الجديدة تظهر أولًا، والتعديل والإخفاء والحذف تعمل وتُدقَّق", async () => {
    const su = await makeSuper();
    await seedGallery(pool, actorOf(su), seed(3));
    const item = await createGalleryItem(pool, actorOf(su), { category: "staff", alt: "فريق الضيافة", src: "/media/gallery/x.webp", width: 1600, height: 900, featured: true, services: ["staffing"] });
    expect(item).toMatchObject({ source: "upload", visible: true, featured: true });
    expect((await listGallery(pool))[0].id).toBe(item.id);

    const upd = await updateGalleryItem(pool, actorOf(su), item.id, { alt: "فريق الضيافة (محدّث)", visible: false, sortOrder: 500 });
    expect(upd).toMatchObject({ alt: "فريق الضيافة (محدّث)", visible: false, sortOrder: 500 });
    expect((await listGallery(pool, { visible: true })).map((g) => g.id)).not.toContain(item.id);
    expect((await listGallery(pool, { category: "staff" })).length).toBe(1);
    expect((await listGallery(pool, { q: "محدّث" })).length).toBe(1);
    expect((await listGallery(pool, { q: "%" })).length).toBe(0); // الرمز % يُعامل حرفيًا

    const removed = await deleteGalleryItem(pool, actorOf(su), item.id);
    expect(removed.src).toBe("/media/gallery/x.webp");
    await expect(deleteGalleryItem(pool, actorOf(su), item.id)).rejects.toMatchObject({ code: "not-found" });
    await expect(updateGalleryItem(pool, actorOf(su), "nope", { alt: "x" })).rejects.toMatchObject({ code: "not-found" });
    const actions = (await listAudit(pool)).rows.map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(["gallery.seed", "gallery.create", "gallery.update", "gallery.delete"]));
  });
});

describe("طلبات التقديم", () => {
  const newApp = (kind: "staff" | "exhibition", over: Partial<Parameters<typeof createApplication>[1]> = {}) => {
    const reference = referenceNumber(new Date(), kind === "staff" ? "STF" : "EXH");
    return { reference, input: { reference, kind, name: "سارة العتيبي", phone: "0512345678", email: "sara@example.com", org: null, summary: "مضيفة", payload: { roles: ["host"], note: "<b>x</b>" }, policyVersion: "2026-11", ...over } as Parameters<typeof createApplication>[1] };
  };

  it("إنشاء وقائمة وفلاتر وبحث وترتيب (الجديد أولًا)", async () => {
    const a = newApp("staff");
    const b = newApp("staff", { name: "محمد الغامدي", phone: "0551112233", email: "m@example.com" });
    const c = newApp("exhibition", { org: "شركة الأفق" });
    for (const x of [a, b, c]) await createApplication(pool, x.input);
    const staff = await listApplications(pool, { kind: "staff" });
    expect(staff.total).toBe(2);
    expect((await listApplications(pool, { kind: "exhibition" })).rows[0]).toMatchObject({ org: "شركة الأفق", status: "new" });
    expect((await listApplications(pool, { kind: "staff", q: "الغامدي" })).total).toBe(1);
    expect((await listApplications(pool, { kind: "staff", q: "0551112233" })).total).toBe(1);
    expect((await listApplications(pool, { kind: "staff", q: "%" })).total).toBe(0);
    expect((await listApplications(pool, { kind: "staff", status: "approved" })).total).toBe(0);
    expect((await listApplications(pool, { kind: "staff", pageSize: 1, page: 2 })).rows.length).toBe(1);
  });

  it("القرارات: قبول، ملاحظات للمتقدم تتطلب نصًا، ورفض؛ والملاحظة الداخلية لا تظهر للمتقدم", async () => {
    const su = await makeSuper();
    const a = newApp("staff");
    await createApplication(pool, a.input);

    await expect(decideApplication(pool, { ...actorOf(su), name: "المدير" }, a.reference, { status: "needs_info" })).rejects.toMatchObject({ code: "invalid" });
    await decideApplication(pool, { ...actorOf(su), name: "المدير" }, a.reference, { status: "needs_info", publicNote: "نرجو إرفاق سيرة ذاتية محدّثة", internalNote: "مرشحة جيدة" });
    let pub = await publicStatus(pool, a.reference, "0512345678");
    expect(pub).toMatchObject({ status: "needs_info" });
    expect(pub!.notes.map((n) => n.body)).toEqual(["نرجو إرفاق سيرة ذاتية محدّثة"]); // لا ملاحظات داخلية

    const detail = await getApplication(pool, a.reference);
    expect(detail!.notes.map((n) => n.kind)).toEqual(["public", "internal"]);
    expect(detail!.application).toMatchObject({ status: "needs_info", reviewedByName: "المدير" });

    expect(await applicantReply(pool, a.reference, "966512345678", "أرفقت السيرة الذاتية، شكرًا")).toBe(true);
    expect((await publicStatus(pool, a.reference, "0512345678"))!.status).toBe("under_review");
    expect(await applicantReply(pool, a.reference, "0512345678", "رد ثانٍ")).toBe(false); // لم تعد بحاجة لاستكمال

    await decideApplication(pool, actorOf(su), a.reference, { status: "approved", publicNote: "مرحبًا بك في الفريق" });
    pub = await publicStatus(pool, a.reference, "0512345678");
    expect(pub!.status).toBe("approved");
    expect(pub!.notes.map((n) => n.kind)).toEqual(["public", "applicant", "public"]);
    await addInternalNote(pool, actorOf(su), a.reference, "تواصلنا هاتفيًا");
    expect((await publicStatus(pool, a.reference, "0512345678"))!.notes.length).toBe(3);
    await expect(addInternalNote(pool, actorOf(su), a.reference, "x")).rejects.toMatchObject({ code: "invalid" });
    await expect(decideApplication(pool, actorOf(su), "STF-00-NOPE00", { status: "approved" })).rejects.toMatchObject({ code: "not-found" });
  });

  it("المتابعة العامة تتطلب رقم الطلب والجوال معًا ولا تكشف طلب غيرك", async () => {
    const a = newApp("exhibition");
    await createApplication(pool, a.input);
    expect(await publicStatus(pool, a.reference, "0512345678")).not.toBeNull();
    expect(await publicStatus(pool, a.reference.toLowerCase(), "+966 51 234 5678")).not.toBeNull();
    expect(await publicStatus(pool, a.reference, "0599999999")).toBeNull();
    expect(await publicStatus(pool, "EXH-26-ZZZZZZ", "0512345678")).toBeNull();
    expect(await publicStatus(pool, a.reference, "invalid")).toBeNull();
    expect(await applicantReply(pool, a.reference, "0599999999", "اختراق")).toBe(false);
  });

  it("الحذف وسياسة الاحتفاظ: المرفوض القديم فقط يُحذف", async () => {
    const su = await makeSuper();
    const old = newApp("staff", { attachment: "private/cv/old.pdf" });
    const fresh = newApp("staff");
    const approved = newApp("staff");
    for (const x of [old, fresh, approved]) await createApplication(pool, x.input);
    await decideApplication(pool, actorOf(su), old.reference, { status: "rejected" });
    await decideApplication(pool, actorOf(su), fresh.reference, { status: "rejected" });
    await decideApplication(pool, actorOf(su), approved.reference, { status: "approved" });
    await pool.query("UPDATE applications SET updated_at = now() - interval '400 days' WHERE reference = ANY($1)", [[old.reference, approved.reference]]);
    const r = await purgeRejectedApplications(pool, 365);
    expect(r).toEqual({ deleted: 1, attachments: ["private/cv/old.pdf"] });
    expect((await getApplication(pool, old.reference))).toBeNull();
    expect(await getApplication(pool, fresh.reference)).not.toBeNull();
    expect(await getApplication(pool, approved.reference)).not.toBeNull(); // المقبول لا يُحذف تلقائيًا

    expect(await deleteApplication(pool, actorOf(su), fresh.reference)).toEqual({ attachment: null });
    await expect(deleteApplication(pool, actorOf(su), fresh.reference)).rejects.toMatchObject({ code: "not-found" });
    expect((await pool.query("SELECT count(*)::int n FROM application_notes")).rows[0].n).toBe(0); // الملاحظات تُحذف بالتتالي
  });

  it("الإحصاءات حسب النوع والحالة", async () => {
    const su = await makeSuper();
    const a = newApp("staff");
    await createApplication(pool, a.input);
    await createApplication(pool, newApp("staff").input);
    await createApplication(pool, newApp("exhibition").input);
    await decideApplication(pool, actorOf(su), a.reference, { status: "approved" });
    const c = await applicationCounts(pool);
    expect(c.staff).toMatchObject({ total: 2, new: 1, approved: 1, rejected: 0 });
    expect(c.exhibition).toMatchObject({ total: 1, new: 1 });
  });

  it("يخزّن النص كما هو دون تنفيذ (حماية XSS تتم عند العرض بـ React)", async () => {
    const a = newApp("staff", { name: "<script>alert(1)</script>" });
    await createApplication(pool, a.input);
    expect((await getApplication(pool, a.reference))!.application.name).toBe("<script>alert(1)</script>");
  });
});

describe("سجل التدقيق وطلبات عروض الأسعار", () => {
  it("يسجّل الأحداث الأمنية ولا يحتوي أسرارًا", async () => {
    const su = await makeSuper();
    await authenticate(pool, SUPER, "Wrong-Password-1234", ctx, 12);
    await authenticate(pool, SUPER, PASSWORD, ctx, 12);
    const { token } = await inviteUser(pool, su, { email: "a@example.com", name: "a", permissions: ["gallery.view"] }, SUPER, "9.9.9.9");
    const log = await listAudit(pool);
    const actions = log.rows.map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(["auth.setup", "auth.login_failed", "auth.login", "user.invite"]));
    const dump = JSON.stringify(log.rows);
    for (const secret of [PASSWORD, "Wrong-Password-1234", token, cfg.bootstrapToken]) expect(dump).not.toContain(secret);
    expect(log.rows.find((r) => r.action === "user.invite")!.ip).toBe("9.9.9.9");
    expect((await listAudit(pool, { action: "auth." })).rows.every((r) => r.action.startsWith("auth."))).toBe(true);
  });

  it("قائمة RFQ تقرأ من الجدول القائم مع بحث", async () => {
    await pool.query(
      `INSERT INTO rfq_leads (reference, payload, status) VALUES ('NMR-26-AAAAAA', '{"organization":"شركة النور","name":"خالد","email":"k@example.com"}', 'stored'),
                                                               ('NMR-26-BBBBBB', '{"organization":"شركة الأمل","name":"هند","email":"h@example.com"}', 'delivered')
       ON CONFLICT DO NOTHING`,
    );
    const all = await listRfqLeads(pool);
    expect(all.total).toBeGreaterThanOrEqual(2);
    expect((await listRfqLeads(pool, { q: "النور" })).rows.map((r) => r.reference)).toEqual(["NMR-26-AAAAAA"]);
    await pool.query("DELETE FROM rfq_leads WHERE reference IN ('NMR-26-AAAAAA','NMR-26-BBBBBB')");
  });
});
