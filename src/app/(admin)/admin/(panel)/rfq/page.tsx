import type { Metadata } from "next";
import { Empty, PageHeader, Pagination, fmtDate } from "@/components/admin/ui";
import { budgetLabels, venueLabels, type Budget, type VenueStatus } from "@/lib/rfq-shared";
import { eventKinds, formatSAR, tiers } from "@/lib/estimator";
import { listRfqLeads } from "@/server/admin/applications";
import { requireDb, requirePermission } from "@/server/admin/context";

export const metadata: Metadata = { title: "طلبات عروض الأسعار" };
export const dynamic = "force-dynamic";

const statusText: Record<string, string> = { stored: "محفوظ", pending: "بانتظار التسليم", delivered: "سُلّم", failed: "فشل التسليم" };

export default async function RfqPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("rfq.view");
  const sp = await searchParams;
  const data = await listRfqLeads(requireDb(), { q: sp.q?.trim() || undefined, page: Number(sp.page) || 1 });

  return (
    <>
      <PageHeader title="طلبات عروض الأسعار" lead="الطلبات المُرسلة من مهيّئ الفعاليات (/rfq). للعرض فقط؛ تُحذف تلقائيًا بعد مدة الاحتفاظ المحددة في إعدادات الخادم." />
      <form method="get" className="mb-6 flex gap-3" role="search">
        <input name="q" defaultValue={sp.q} placeholder="بحث بالجهة أو الاسم أو البريد أو الرقم" className="field flex-1" aria-label="بحث" />
        <button type="submit" className="btn-primary">بحث</button>
      </form>
      {data.rows.length === 0 ? (
        <Empty>لا توجد طلبات.</Empty>
      ) : (
        <ul className="space-y-3">
          {data.rows.map((r) => {
            const p = r.payload;
            const kind = eventKinds.find((k) => k.id === p.kind)?.label ?? p.kind;
            const tier = tiers.find((t) => t.id === p.tier)?.label ?? p.tier;
            return (
              <li key={r.reference} className="card p-5">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                    <span><span className="font-semibold">{p.organization}</span> <span className="text-muted">— {kind} · {p.guests} ضيف · {p.days} يوم</span></span>
                    <span className="flex items-center gap-3 text-sm text-muted">
                      <span dir="ltr" className="font-mono text-xs">{r.reference}</span>
                      <span className="rounded-full bg-elevated px-3 py-1 text-xs">{statusText[r.status] ?? r.status}</span>
                      <time>{fmtDate(r.createdAt)}</time>
                    </span>
                  </summary>
                  <dl className="mt-4 grid gap-x-8 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-muted">المسؤول</dt><dd>{p.name}</dd></div>
                    <div><dt className="text-muted">الجوال</dt><dd dir="ltr">{p.phone}</dd></div>
                    <div><dt className="text-muted">البريد</dt><dd dir="ltr" className="break-all">{p.email}</dd></div>
                    <div><dt className="text-muted">المستوى</dt><dd>{tier}</dd></div>
                    <div><dt className="text-muted">التاريخ المتوقع</dt><dd>{p.date}</dd></div>
                    <div><dt className="text-muted">الموقع</dt><dd>{venueLabels[p.venueStatus as VenueStatus] ?? p.venueStatus}</dd></div>
                    <div><dt className="text-muted">الميزانية</dt><dd>{budgetLabels[p.budget as Budget] ?? p.budget}</dd></div>
                    <div><dt className="text-muted">التقدير</dt><dd>{p.estimate ? `${formatSAR(p.estimate.low)} – ${formatSAR(p.estimate.high)}` : "—"}</dd></div>
                    {p.goals && <div className="sm:col-span-2"><dt className="text-muted">الأهداف</dt><dd className="whitespace-pre-wrap">{p.goals}</dd></div>}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={data.page} total={data.total} pageSize={data.pageSize} basePath="/admin/rfq" params={{ q: sp.q }} />
    </>
  );
}
