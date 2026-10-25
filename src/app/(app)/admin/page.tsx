import type { Metadata } from "next";
import { AdminDashboard } from "@/components/app/AdminDashboard";
import { AppShell } from "@/components/app/AppShell";
import { getSession, signQr } from "@/server/auth";
import { read } from "@/server/db";

export const metadata: Metadata = { title: "لوحة الإدارة العليا" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [db, session] = await Promise.all([read(), getSession()]);
  const staffQr = Object.fromEntries(db.staff.map((s) => [s.id, signQr("STAFF", s.id)]));
  const assignQr = Object.fromEntries(
    db.projects.flatMap((p) => p.assignments.map((a) => [`${p.id}:${a.staffId}`, signQr("ASSIGN", p.id, a.staffId)])),
  );
  return (
    <AppShell
      title="لوحة الإدارة والتحكم التشغيلي"
      subtitle="إضافة ومتابعة المشاريع، دراسة المتطلبات، مطابقة الكوادر الميدانية وإصدار QR للتحضير، ومتابعة خط المبيعات."
      user={session?.name}
      links={[{ href: "/admin", label: "الإدارة" }, { href: "/ops", label: "العمليات" }, { href: "/portal", label: "بوابة العملاء" }, { href: "/", label: "الموقع" }]}
    >
      <AdminDashboard db={{ staff: db.staff, projects: db.projects, leads: db.leads }} staffQr={staffQr} assignQr={assignQr} />
    </AppShell>
  );
}
