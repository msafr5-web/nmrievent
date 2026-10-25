import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";
import { OpsHub } from "@/components/app/OpsHub";
import { getSession } from "@/server/auth";
import { read } from "@/server/db";

export const metadata: Metadata = { title: "لوحة العمليات الميدانية" };
export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const [db, session] = await Promise.all([read(), getSession()]);
  const staff = Object.fromEntries(db.staff.map((s) => [s.id, { name: s.name, phone: s.phone }]));
  const links = [{ href: "/ops", label: "العمليات" }, ...(session?.role === "admin" ? [{ href: "/admin", label: "الإدارة" }] : [])];
  return (
    <AppShell
      title="لوحة التحكم التشغيلية للفرق"
      subtitle="إدارة الكوادر والمضيفين، التحضير بالنطاق الجغرافي، ومتابعة الحشود والمواقف في الوقت الفعلي."
      user={session?.name}
      links={links}
    >
      <OpsHub projects={db.projects.filter((p) => p.status !== "مكتمل")} staff={staff} />
    </AppShell>
  );
}
