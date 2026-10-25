import { verifyQr } from "@/server/auth";
import { mutate } from "@/server/db";
import { fail, ok, parse, err, isErr } from "@/server/http";
import { checkinSchema } from "@/server/schemas";
import { distanceM } from "@/lib/geo";

/** تحضير الموظف من بطاقته بالتحقق من وجوده داخل النطاق الجغرافي للفعالية (FR-03) */
export async function POST(req: Request) {
  const p = await parse(req, checkinSchema);
  if ("res" in p) return p.res;
  const t = verifyQr(p.data.token);
  if (!t || t.kind !== "ASSIGN") return fail("بطاقة غير صالحة.", 403);
  const [projectId, staffId] = t.ids;

  const r = await mutate((db) => {
    const project = db.projects.find((x) => x.id === projectId);
    const a = project?.assignments.find((x) => x.staffId === staffId);
    if (!project || !a) return err("لا يوجد إسناد لهذه البطاقة.", 404);
    const d = distanceM(project.geo, p.data);
    if (d > project.geo.radiusM) return err(`أنت خارج نطاق الفعالية (${d.toLocaleString("en-US")} م، المسموح ${project.geo.radiusM} م).`, 403);
    const now = new Date().toISOString();
    if (p.data.action === "in") {
      if (a.checkIn) return err("تم تسجيل حضورك مسبقًا.", 409);
      a.checkIn = { at: now, distanceM: d, method: "geo" };
    } else {
      if (!a.checkIn) return err("سجّل الحضور أولًا.", 409);
      a.checkOut = { at: now };
    }
    return { ok: true, at: now, distance: d } as const;
  });

  return isErr(r) ? fail(r.error, r.status) : ok(r);
}
