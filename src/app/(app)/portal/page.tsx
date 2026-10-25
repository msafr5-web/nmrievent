import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";
import { ClientPortal } from "@/components/app/ClientPortal";
import { getSession } from "@/server/auth";
import { read } from "@/server/db";

export const metadata: Metadata = { title: "بوابة العملاء" };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const [db, session] = await Promise.all([read(), getSession()]);
  const isAdmin = session?.role === "admin";
  const projects = isAdmin ? db.projects.filter((p) => p.reference) : db.projects.filter((p) => p.reference === session?.sub);
  const leads = isAdmin ? [] : db.leads.filter((l) => l.reference === session?.sub);
  const team = Object.fromEntries(
    projects.map((p) => [p.id, { assigned: p.assignments.length, present: p.assignments.filter((a) => a.checkIn && !a.checkOut).length }]),
  );
  return (
    <AppShell
      title={`أهلًا ${session?.name ?? ""}`}
      subtitle="تابع مراحل مشروعك، اعتمد المخرجات ووقّعها رقميًا، واطّلع على التقارير والتوثيق الإعلامي."
      user={session?.name}
      links={isAdmin ? [{ href: "/admin", label: "الإدارة" }, { href: "/portal", label: "بوابة العملاء" }] : undefined}
    >
      <ClientPortal
        projects={projects.map(({ assignments: _a, ...p }) => (void _a, p))}
        leads={leads.map((l) => ({ reference: l.reference, stage: l.stage, receivedAt: l.receivedAt, organization: l.organization, low: l.estimate.low, high: l.estimate.high }))}
        team={team}
      />
    </AppShell>
  );
}
