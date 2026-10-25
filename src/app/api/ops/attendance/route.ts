import { requireRole } from "@/server/auth";
import { mutate } from "@/server/db";
import { fail, ok, parse, unauthorized } from "@/server/http";
import { attendanceSchema } from "@/server/schemas";

/** تحضير يدوي من المشرف الميداني (بديل عند تعذر تحديد الموقع) */
export async function POST(req: Request) {
  if (!(await requireRole("admin", "ops"))) return unauthorized();
  const p = await parse(req, attendanceSchema);
  if ("res" in p) return p.res;
  const { projectId, staffId, action } = p.data;
  const r = await mutate((db) => {
    const a = db.projects.find((x) => x.id === projectId)?.assignments.find((x) => x.staffId === staffId);
    if (!a) return null;
    const at = new Date().toISOString();
    if (action === "in") a.checkIn ??= { at, distanceM: 0, method: "manual" };
    else if (a.checkIn) a.checkOut ??= { at };
    return a;
  });
  return r ? ok({ assignment: r }) : fail("الإسناد غير موجود.", 404);
}
