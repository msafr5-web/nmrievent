import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Notice } from "@/components/admin/ui";
import { dbOrNull } from "@/server/admin/context";
import { peekInvite } from "@/server/admin/users";
import { acceptInviteAction } from "../../../actions";

export const metadata: Metadata = { title: "تفعيل الحساب" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = dbOrNull();
  const info = db ? await peekInvite(db, token) : null;

  if (!info) {
    return (
      <div className="card p-8">
        <h1 className="text-2xl font-bold">الرابط غير صالح</h1>
        <Notice tone="danger">هذا الرابط منتهي الصلاحية أو سبق استخدامه. اطلب من المدير الأعلى رابطًا جديدًا.</Notice>
      </div>
    );
  }
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold">{info.kind === "reset" ? "تعيين كلمة سر جديدة" : "تفعيل حسابك"}</h1>
      <p className="mt-2 text-sm leading-7 text-muted">
        مرحبًا {info.name}. اختر كلمة سر للحساب <span dir="ltr">{info.email}</span>.
      </p>
      <div className="mt-6">
        <ActionForm action={acceptInviteAction} submit="حفظ وتفعيل" pendingText="جارٍ الحفظ…">
          <input type="hidden" name="token" value={token} />
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
