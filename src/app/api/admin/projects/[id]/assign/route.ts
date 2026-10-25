import { requireRole, signQr } from "@/server/auth";
import { mutate } from "@/server/db";
import { fail, notify, ok, parse, unauthorized, err, isErr } from "@/server/http";
import { assignSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

/** إسناد موظف لمشروع: يصدر بطاقة QR خاصة بالفعالية ويُرسل إشعار التواصل */
export async function POST(req: Request, { params }: Ctx) {
  if (!(await requireRole("admin"))) return unauthorized();
  const p = await parse(req, assignSchema);
  if ("res" in p) return p.res;
  const { id } = await params;
  const { staffId, role, shiftStart, shiftEnd } = p.data;
  if (new Date(shiftEnd) <= new Date(shiftStart)) return fail("نهاية الوردية يجب أن تكون بعد بدايتها.", 422, { shiftEnd: "بعد البداية" });

  const r = await mutate((db) => {
    const prj = db.projects.find((x) => x.id === id);
    const staff = db.staff.find((s) => s.id === staffId);
    if (!prj || !staff) return err("المشروع أو الموظف غير موجود.", 404);
    if (prj.assignments.some((a) => a.staffId === staffId)) return err("الموظف مُسند لهذا المشروع مسبقًا.", 409);
    prj.assignments.push({ staffId, role, shiftStart: new Date(shiftStart).toISOString(), shiftEnd: new Date(shiftEnd).toISOString(), notifiedAt: new Date().toISOString() });
    return { staff, project: prj } as const;
  });
  if (isErr(r)) return fail(r.error, r.status);

  const token = signQr("ASSIGN", id, staffId);
  await notify("staff.assigned", { staff: { name: r.staff.name, phone: r.staff.phone, email: r.staff.email }, project: r.project.name, badgePath: `/badge/${token}` });
  return ok({ token, badgePath: `/badge/${token}` }, 201);
}
