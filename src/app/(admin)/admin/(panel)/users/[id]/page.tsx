import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { PermissionBoxes } from "@/components/admin/PermissionBoxes";
import { PresetPicker } from "@/components/admin/PresetPicker";
import { Notice, PageHeader, fmtDate } from "@/components/admin/ui";
import { requireDb, requirePermission } from "@/server/admin/context";
import { getUser } from "@/server/admin/users";
import { resetLinkAction, updateUserAction } from "../../../actions";

export const metadata: Metadata = { title: "إدارة مستخدم" };
export const dynamic = "force-dynamic";

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission("users.manage");
  const { id } = await params;
  const u = await getUser(requireDb(), id);
  if (!u || u.isSuper) notFound();

  return (
    <>
      <PageHeader title={u.name} lead={u.email} actions={<Link href="/admin/users" className="btn-ghost">← المستخدمون</Link>} />
      {!u.hasPassword && <Notice tone="warn">هذا الحساب لم يُفعَّل بعد (لم يحدد كلمة سر). أصدر رابطًا جديدًا إن انتهت صلاحية رابط الدعوة.</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-6" aria-labelledby="edit">
          <h2 id="edit" className="text-xl font-bold">الصلاحيات والحالة</h2>
          <ActionForm action={updateUserAction} submit="حفظ التعديلات" className="mt-5 space-y-5">
            <input type="hidden" name="userId" value={u.id} />
            <div>
              <label htmlFor="name" className="label">الاسم</label>
              <input id="name" name="name" required minLength={2} maxLength={120} defaultValue={u.name} className="field" />
            </div>
            <div>
              <p className="label">الصلاحيات</p>
              <PresetPicker />
              <div className="mt-3"><PermissionBoxes checked={u.permissions} /></div>
              <p className="mt-3 text-xs leading-6 text-muted">صلاحيات «التعديل» و«المراجعة» و«الحذف» تتضمن «العرض» تلقائيًا. عند الحفظ تُنهى جلسات المستخدم الحالية ليسري التغيير فورًا.</p>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} className="h-4 w-4 accent-[rgb(var(--brand))]" />
              الحساب نشط (إلغاء التحديد يمنع الدخول فورًا)
            </label>
          </ActionForm>
        </section>

        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="reset">
            <h2 id="reset" className="text-xl font-bold">رابط كلمة السر</h2>
            <p className="mt-2 text-sm leading-7 text-muted">إن نسي المستخدم كلمة سره أو لم يُفعّل حسابه، أصدر رابطًا جديدًا (صالح 72 ساعة، يعمل مرة واحدة) وأرسله له. الروابط السابقة تُلغى.</p>
            <div className="mt-4">
              <ActionForm action={resetLinkAction} submit="إصدار رابط جديد" variant="ghost">
                <input type="hidden" name="userId" value={u.id} />
              </ActionForm>
            </div>
          </section>
          <section className="card p-6 text-sm">
            <h2 className="mb-3 text-xl font-bold">معلومات</h2>
            <dl className="grid grid-cols-2 gap-3">
              <dt className="text-muted">أُنشئ</dt><dd>{fmtDate(u.createdAt)}</dd>
              <dt className="text-muted">آخر دخول</dt><dd>{fmtDate(u.lastLoginAt)}</dd>
              <dt className="text-muted">الحالة</dt><dd>{u.active ? (u.hasPassword ? "نشط" : "بانتظار التفعيل") : "معطّل"}</dd>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
