import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { Notice } from "@/components/admin/ui";
import { dbOrNull, serverEnv } from "@/server/admin/context";
import { hasSuperAdmin } from "@/server/admin/users";
import { setupAction } from "../../actions";

export const metadata: Metadata = { title: "الإعداد الأولي" };
export const dynamic = "force-dynamic";

/** إنشاء حساب المدير الأعلى مرة واحدة برمز الإعداد السري من ملف الأسرار؛ يُغلق نهائيًا بعد الإنشاء */
export default async function SetupPage() {
  const db = dbOrNull();
  if (!db) return <div className="card p-8"><Notice tone="danger">قاعدة البيانات غير مهيأة على هذا الخادم.</Notice></div>;
  if (await hasSuperAdmin(db)) redirect("/admin/login");
  const env = serverEnv();
  if (!env.ADMIN_BOOTSTRAP_TOKEN) {
    return <div className="card p-8"><Notice tone="warn">الإعداد الأولي غير مفعّل: اضبط ADMIN_BOOTSTRAP_TOKEN في إعدادات الخادم.</Notice></div>;
  }

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold">الإعداد الأولي</h1>
      <p className="mt-2 text-sm leading-7 text-muted">
        إنشاء حساب المدير الأعلى (<span dir="ltr">{env.SUPER_ADMIN_EMAIL}</span>). تحتاج رمز الإعداد الموجود في ملف أسرار الخادم (ADMIN_BOOTSTRAP_TOKEN).
      </p>
      <div className="mt-6">
        <ActionForm action={setupAction} submit="إنشاء الحساب" pendingText="جارٍ الإنشاء…">
          <div>
            <label htmlFor="email" className="label">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" required defaultValue={env.SUPER_ADMIN_EMAIL} dir="ltr" className="field" autoComplete="username" />
          </div>
          <div>
            <label htmlFor="name" className="label">الاسم</label>
            <input id="name" name="name" required minLength={2} maxLength={120} className="field" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="token" className="label">رمز الإعداد</label>
            <input id="token" name="token" type="password" required dir="ltr" className="field" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="password" className="label">كلمة السر (12 حرفًا على الأقل، حروف وأرقام)</label>
            <input id="password" name="password" type="password" required minLength={12} dir="ltr" className="field" autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirm" className="label">تأكيد كلمة السر</label>
            <input id="confirm" name="confirm" type="password" required minLength={12} dir="ltr" className="field" autoComplete="new-password" />
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
