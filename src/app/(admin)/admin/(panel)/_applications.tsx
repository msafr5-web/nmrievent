import { notFound } from "next/navigation";
import { ApplicationDetail, ApplicationList } from "@/components/admin/ApplicationViews";
import { APPLICATION_STATUSES, type ApplicationKind, type ApplicationStatus } from "@/lib/applications-shared";
import { applicationPermission } from "@/lib/permissions";
import { getApplication, listApplications } from "@/server/admin/applications";
import { audit } from "@/server/admin/audit";
import { clientIp, requestOrigin, requireDb, requirePermission } from "@/server/admin/context";
import { actorOf } from "@/server/admin/users";

type Search = { q?: string; status?: string; page?: string };

/** صفحة قائمة الطلبات لنوع معيّن (يُتحقق من صلاحية العرض في كل استدعاء) */
export async function ApplicationsListPage({ kind, searchParams }: { kind: ApplicationKind; searchParams: Promise<Search> }) {
  await requirePermission(applicationPermission(kind, "view"));
  const sp = await searchParams;
  const status = (APPLICATION_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as ApplicationStatus) : undefined;
  const data = await listApplications(requireDb(), { kind, status, q: sp.q?.trim() || undefined, page: Number(sp.page) || 1 });
  return <ApplicationList kind={kind} data={data} q={sp.q} status={status} />;
}

/** صفحة تفاصيل طلب: تسجَّل مشاهدتها في سجل النشاط لأنها تعرض بيانات شخصية */
export async function ApplicationDetailPage({ kind, params }: { kind: ApplicationKind; params: Promise<{ ref: string }> }) {
  const user = await requirePermission(applicationPermission(kind, "view"));
  const { ref } = await params;
  const db = requireDb();
  const detail = await getApplication(db, ref.toUpperCase());
  if (!detail || detail.application.kind !== kind) notFound();
  await audit(db, actorOf(user), "application.view", { entity: "application", entityId: detail.application.reference, ip: await clientIp() });
  return <ApplicationDetail kind={kind} application={detail.application} notes={detail.notes} user={user} origin={await requestOrigin()} />;
}
