import { requireRole } from "@/server/auth";
import { mutate } from "@/server/db";
import { fail, ok, parse, unauthorized } from "@/server/http";
import { projectPatchSchema } from "@/server/schemas";
import type { ProjectStatus } from "@/server/types";

type Ctx = { params: Promise<{ id: string }> };

/** تحديث حالة المشروع / تقديم المرحلة (الإدارة) أو قراءات الحشود والمواقف (العمليات) */
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireRole("admin", "ops");
  if (!session) return unauthorized();
  const p = await parse(req, projectPatchSchema);
  if ("res" in p) return p.res;
  const { id } = await params;
  const body = p.data;
  if (session.role === "ops" && (body.status || body.advanceMilestone)) return unauthorized();

  const project = await mutate((db) => {
    const prj = db.projects.find((x) => x.id === id);
    if (!prj) return null;
    if (body.status) prj.status = body.status as ProjectStatus;
    if (body.advanceMilestone) {
      const i = prj.milestones.findIndex((m) => m.status === "current");
      if (i >= 0) {
        prj.milestones[i].status = "done";
        prj.milestones[i].date ??= new Date().toISOString().slice(0, 10);
        if (prj.milestones[i + 1]) prj.milestones[i + 1].status = "current";
        if (prj.milestones[i].key === "design") prj.status = "قيد التشغيل";
        if (prj.milestones[i].key === "delivery") prj.status = "مكتمل";
      }
    }
    for (const z of body.zones ?? []) {
      const zone = prj.zones.find((x) => x.name === z.name);
      if (zone) zone.current = Math.min(z.current, zone.capacity * 1.2);
    }
    if (body.parkingOccupied !== undefined) prj.parking.occupied = Math.min(body.parkingOccupied, prj.parking.capacity);
    return prj;
  });
  return project ? ok({ project }) : fail("المشروع غير موجود.", 404);
}
