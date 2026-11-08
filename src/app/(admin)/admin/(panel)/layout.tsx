import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { hasPermission } from "@/lib/permissions";
import { applicationCounts } from "@/server/admin/applications";
import { dbOrNull, requireUser } from "@/server/admin/context";

/**
 * قشرة اللوحة: تتطلب جلسة صالحة. ملاحظة أمنية: التحقق هنا لا يكفي وحده (الـ layout لا يُعاد تنفيذه عند التنقل)،
 * لذا كل صفحة وكل إجراء يستدعي requirePermission/authorize بنفسه.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = dbOrNull()!;
  const counts = await applicationCounts(db);
  // الشارة = الطلبات الجديدة التي لم تُراجع بعد
  const pending = (k: "staff" | "exhibition") => counts[k].new;

  const items: (NavItem & { show: boolean })[] = [
    { href: "/admin", label: "لوحة المعلومات", show: true },
    { href: "/admin/gallery", label: "معرض الصور", show: hasPermission(user, "gallery.view") },
    { href: "/admin/staff", label: "طلبات التوظيف", badge: pending("staff"), show: hasPermission(user, "staff.view") },
    { href: "/admin/exhibitions", label: "طلبات المعارض", badge: pending("exhibition"), show: hasPermission(user, "exhibitions.view") },
    { href: "/admin/rfq", label: "طلبات عروض الأسعار", show: hasPermission(user, "rfq.view") },
    { href: "/admin/users", label: "المستخدمون والصلاحيات", show: hasPermission(user, "users.manage") },
    { href: "/admin/audit", label: "سجل النشاط", show: hasPermission(user, "audit.view") },
  ];

  return (
    <div className="lg:flex">
      <AdminNav items={items.filter((i) => i.show).map(({ href, label, badge }) => ({ href, label, badge }))} user={{ name: user.name, email: user.email, isSuper: user.isSuper }} />
      <main id="admin-main" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
