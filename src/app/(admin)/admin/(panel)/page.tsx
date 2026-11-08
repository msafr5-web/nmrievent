import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PageHeader, Stat, fmtDate } from "@/components/admin/ui";
import { hasPermission, permissionLabel } from "@/lib/permissions";
import { applicationCounts } from "@/server/admin/applications";
import { auditLabel, listAudit } from "@/server/admin/audit";
import { requireUser, requireDb } from "@/server/admin/context";
import { countGallery } from "@/server/admin/gallery";

export const metadata: Metadata = { title: "لوحة المعلومات" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = requireDb();
  const [counts, gallery, rfq, audit] = await Promise.all([
    applicationCounts(db),
    hasPermission(user, "gallery.view") ? countGallery(db) : null,
    hasPermission(user, "rfq.view") ? db.query(`SELECT count(*)::int AS week FROM rfq_leads WHERE created_at > now() - interval '7 days'`).then((r) => r.rows[0].week as number) : null,
    hasPermission(user, "audit.view") ? listAudit(db, { limit: 8 }) : null,
  ]);

  return (
    <>
      <PageHeader title={`أهلًا ${user.name}`} lead={user.isSuper ? "أنت المدير الأعلى: تمنح الصلاحيات وتدير المستخدمين." : "الأقسام المتاحة لك تظهر في القائمة الجانبية."} />
      {sp.denied && <Notice tone="warn">ليست لديك صلاحية: {permissionLabel(sp.denied)}. اطلب من المدير الأعلى منحك إياها.</Notice>}

      <section aria-labelledby="stats" className="mb-10">
        <h2 id="stats" className="sr-only">ملخص</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {hasPermission(user, "staff.view") && <Stat label="طلبات توظيف جديدة" value={counts.staff.new} href="/admin/staff?status=new" tone="brand" />}
          {hasPermission(user, "staff.view") && <Stat label="توظيف بانتظار استكمال" value={counts.staff.needs_info} href="/admin/staff?status=needs_info" />}
          {hasPermission(user, "exhibitions.view") && <Stat label="طلبات معارض جديدة" value={counts.exhibition.new} href="/admin/exhibitions?status=new" tone="brand" />}
          {hasPermission(user, "exhibitions.view") && <Stat label="معارض قيد المراجعة" value={counts.exhibition.under_review} href="/admin/exhibitions?status=under_review" />}
          {gallery && <Stat label="صور في المعرض" value={`${gallery.visible} / ${gallery.total}`} href="/admin/gallery" />}
          {rfq !== null && <Stat label="طلبات أسعار هذا الأسبوع" value={rfq} href="/admin/rfq" />}
          {hasPermission(user, "staff.view") && <Stat label="إجمالي طلبات التوظيف" value={counts.staff.total} href="/admin/staff" />}
          {hasPermission(user, "exhibitions.view") && <Stat label="إجمالي طلبات المعارض" value={counts.exhibition.total} href="/admin/exhibitions" />}
        </div>
      </section>

      {audit && (
        <section aria-labelledby="recent">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent" className="text-xl font-bold">آخر النشاط</h2>
            <Link href="/admin/audit" className="text-sm font-semibold text-brand">عرض السجل كاملًا</Link>
          </div>
          <div className="card divide-y divide-line">
            {audit.rows.length === 0 && <p className="p-6 text-muted">لا نشاط بعد.</p>}
            {audit.rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <span><span className="font-semibold">{auditLabel(r.action)}</span> <span className="text-muted" dir="ltr">{r.actorEmail ?? ""}</span></span>
                <time className="text-muted">{fmtDate(r.at)}</time>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
