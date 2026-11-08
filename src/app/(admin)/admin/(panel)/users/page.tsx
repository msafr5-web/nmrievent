import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { PermissionBoxes } from "@/components/admin/PermissionBoxes";
import { PresetPicker } from "@/components/admin/PresetPicker";
import { PageHeader, fmtDate } from "@/components/admin/ui";
import { requireDb, requirePermission } from "@/server/admin/context";
import { listUsers } from "@/server/admin/users";
import { inviteUserAction } from "../../actions";

export const metadata: Metadata = { title: "المستخدمون والصلاحيات" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("users.manage");
  const users = await listUsers(requireDb());

  return (
    <>
      <PageHeader title="المستخدمون والصلاحيات" lead="أنت وحدك تمنح الصلاحيات. أنشئ حسابًا بالبريد والاسم ثم أرسل رابط التفعيل للمستخدم ليحدد كلمة سره بنفسه، فلا تمر كلمات السر عليك." />

      <section className="card mb-10 p-6" aria-labelledby="invite">
        <h2 id="invite" className="text-xl font-bold">إضافة مستخدم</h2>
        <ActionForm action={inviteUserAction} submit="إنشاء الحساب وإصدار رابط التفعيل" pendingText="جارٍ الإنشاء…" className="mt-5 space-y-5" resetOnSuccess>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">الاسم</label>
              <input id="name" name="name" required minLength={2} maxLength={120} className="field" autoComplete="off" />
            </div>
            <div>
              <label htmlFor="email" className="label">البريد الإلكتروني</label>
              <input id="email" name="email" type="email" required dir="ltr" className="field" autoComplete="off" />
            </div>
          </div>
          <div>
            <p className="label">الصلاحيات</p>
            <PresetPicker />
            <div className="mt-3"><PermissionBoxes /></div>
          </div>
        </ActionForm>
      </section>

      <section aria-labelledby="list">
        <h2 id="list" className="mb-4 text-xl font-bold">المستخدمون ({users.length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                {["الاسم", "البريد", "الحالة", "الصلاحيات", "آخر دخول", ""].map((h, i) => <th key={i} className="p-4 text-start font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="p-4 font-semibold">{u.name}{u.isSuper && <span className="ms-2 rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">مدير أعلى</span>}</td>
                  <td className="p-4" dir="ltr">{u.email}</td>
                  <td className="p-4">{!u.active ? <span className="text-danger">معطّل</span> : !u.hasPassword ? <span className="text-sand">بانتظار التفعيل</span> : "نشط"}</td>
                  <td className="p-4 text-muted">{u.isSuper ? "كل الصلاحيات" : `${u.permissions.length} صلاحية`}</td>
                  <td className="whitespace-nowrap p-4 text-muted">{fmtDate(u.lastLoginAt)}</td>
                  <td className="p-4">{!u.isSuper && <Link href={`/admin/users/${u.id}`} className="font-semibold text-brand hover:underline">إدارة</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
