import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { Notice } from "@/components/admin/ui";
import { currentUser, dbOrNull, serverEnv } from "@/server/admin/context";
import { hasSuperAdmin } from "@/server/admin/users";
import { loginAction } from "../../actions";

export const metadata: Metadata = { title: "تسجيل الدخول" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ setup?: string; activated?: string }> }) {
  const sp = await searchParams;
  if (await currentUser()) redirect("/admin");
  const db = dbOrNull();
  const needsSetup = db ? !(await hasSuperAdmin(db)) && Boolean(serverEnv().ADMIN_BOOTSTRAP_TOKEN) : false;

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
      <p className="mt-2 text-sm leading-7 text-muted">لوحة تحكم NMR Events — للمصرَّح لهم فقط.</p>
      <div className="mt-6">
        {!db && <Notice tone="danger">قاعدة البيانات غير مهيأة على هذا الخادم (DATABASE_URL).</Notice>}
        {sp.setup && <Notice>تم إنشاء حساب المدير الأعلى. سجّل الدخول الآن.</Notice>}
        {sp.activated && <Notice>تم تفعيل حسابك. سجّل الدخول الآن.</Notice>}
        {needsSetup && (
          <Notice tone="warn">
            لم يُنشأ المدير الأعلى بعد. <a href="/admin/setup" className="font-semibold text-brand underline">أكمل الإعداد الأولي</a> برمز الإعداد.
          </Notice>
        )}
        <ActionForm action={loginAction} submit="دخول" pendingText="جارٍ الدخول…" className="space-y-5">
          <div>
            <label htmlFor="email" className="label">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" required autoComplete="username" dir="ltr" className="field" />
          </div>
          <div>
            <label htmlFor="password" className="label">كلمة السر</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" dir="ltr" className="field" />
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
