import type { Metadata } from "next";
import { Empty, PageHeader, Pagination, fmtDate } from "@/components/admin/ui";
import { auditLabel, listAudit } from "@/server/admin/audit";
import { requireDb, requirePermission } from "@/server/admin/context";

export const metadata: Metadata = { title: "سجل النشاط" };
export const dynamic = "force-dynamic";

const PAGE = 50;
const groups = [
  ["", "كل الأحداث"],
  ["auth.", "الدخول والخروج"],
  ["user.", "المستخدمون والصلاحيات"],
  ["gallery.", "معرض الصور"],
  ["application.", "طلبات التقديم"],
] as const;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ g?: string; page?: string }> }) {
  await requirePermission("audit.view");
  const sp = await searchParams;
  const group = groups.some(([g]) => g === (sp.g ?? "")) ? (sp.g ?? "") : "";
  const page = Math.max(Number(sp.page) || 1, 1);
  const { rows, total } = await listAudit(requireDb(), { limit: PAGE, offset: (page - 1) * PAGE, action: group || undefined });

  return (
    <>
      <PageHeader title="سجل النشاط" lead="من فعل ماذا ومتى. يُستخدم للمساءلة ومراجعة الوصول للبيانات الشخصية. لا تُسجَّل فيه كلمات السر ولا الرموز." />
      <form method="get" className="mb-6 flex gap-3" role="search">
        <select name="g" defaultValue={group} className="field sm:w-64" aria-label="نوع الحدث">
          {groups.map(([g, label]) => <option key={g} value={g}>{label}</option>)}
        </select>
        <button type="submit" className="btn-primary">تطبيق</button>
      </form>
      {rows.length === 0 ? (
        <Empty>لا أحداث.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                {["الوقت", "المنفّذ", "الحدث", "الهدف", "العنوان"].map((h) => <th key={h} className="p-4 text-start font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap p-4 text-muted">{fmtDate(r.at)}</td>
                  <td className="p-4" dir="ltr">{r.actorEmail ?? "—"}</td>
                  <td className="p-4 font-medium">{auditLabel(r.action)}</td>
                  <td className="p-4 text-muted" dir="ltr">{r.entity ? `${r.entity}${r.entityId ? ` · ${r.entityId}` : ""}` : "—"}</td>
                  <td className="p-4 text-muted" dir="ltr">{r.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} pageSize={PAGE} basePath="/admin/audit" params={{ g: group }} />
    </>
  );
}
