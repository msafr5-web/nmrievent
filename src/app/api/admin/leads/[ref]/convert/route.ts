import { requireRole } from "@/server/auth";
import { mutate, newId } from "@/server/db";
import { fail, ok, unauthorized, err, isErr } from "@/server/http";
import { addOns, cities, eventKinds } from "@/lib/estimator";
import type { Project } from "@/server/types";

type Ctx = { params: Promise<{ ref: string }> };

/** تحويل طلب العرض المتعاقد عليه إلى مشروع تشغيلي مرتبط ببوابة العميل */
export async function POST(_req: Request, { params }: Ctx) {
  if (!(await requireRole("admin"))) return unauthorized();
  const { ref } = await params;
  const r = await mutate((db) => {
    const l = db.leads.find((x) => x.reference === ref);
    if (!l) return err("الطلب غير موجود.", 404);
    const existing = db.projects.find((x) => x.reference === ref);
    if (existing) return { project: existing } as const;
    l.stage = "won";
    const project: Project = {
      id: newId("prj"),
      name: `${eventKinds.find((k) => k.id === l.kind)?.label ?? "فعالية"} — ${l.organization}`,
      date: l.date,
      location: cities.find((c) => c.id === l.city)?.label ?? "",
      area: "يحدد بعد زيارة الموقع",
      services: l.addOns.map((a) => addOns.find((x) => x.id === a)?.label).filter(Boolean).join("، ") || "حسب العرض",
      duration: `${l.days} ${l.days > 2 ? "أيام" : l.days === 2 ? "يومان" : "يوم"}`,
      entity: l.organization,
      supervisor: "يُعيَّن لاحقًا",
      status: "دراسة وتحديد المتطلبات",
      geo: { lat: 24.7136, lng: 46.6753, radiusM: 300 },
      reference: l.reference,
      clientEmail: l.email.toLowerCase(),
      milestones: [
        { key: "planning", status: "current" },
        { key: "design", status: "upcoming" },
        { key: "execution", status: "upcoming" },
        { key: "delivery", status: "upcoming", date: l.date },
      ],
      approvals: [{ id: newId("apr"), title: "عقد تنفيذ الفعالية", kind: "عقد", status: "pending" }],
      reports: [],
      assignments: [],
      zones: [{ name: "المدخل الرئيسي", capacity: Math.max(100, Math.round(l.guests * 0.4)), current: 0 }],
      parking: { capacity: Math.max(50, Math.round(l.guests * 0.3)), occupied: 0 },
      createdAt: new Date().toISOString(),
    };
    db.projects.unshift(project);
    return { project } as const;
  });
  return isErr(r) ? fail(r.error, r.status) : ok(r, 201);
}
