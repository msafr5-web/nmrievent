import { requireRole } from "@/server/auth";
import { mutate } from "@/server/db";
import { fail, notify, ok, parse, unauthorized } from "@/server/http";
import { approveSchema } from "@/server/schemas";

/** اعتماد وتوقيع رقمي من العميل (بوابة العملاء) */
export async function POST(req: Request) {
  const session = await requireRole("client", "admin");
  if (!session) return unauthorized();
  const p = await parse(req, approveSchema);
  if ("res" in p) return p.res;
  const { projectId, approvalId, signedBy, signature } = p.data;

  const r = await mutate((db) => {
    const prj = db.projects.find((x) => x.id === projectId);
    if (!prj || (session.role === "client" && prj.reference !== session.sub)) return null;
    const a = prj.approvals.find((x) => x.id === approvalId);
    if (!a || a.status === "approved") return null;
    Object.assign(a, { status: "approved", signedBy, signedAt: new Date().toISOString(), signature });
    return { project: prj.name, approval: a.title };
  });
  if (!r) return fail("تعذر الاعتماد.", 404);
  await notify("client.approved", r);
  return ok({ ok: true });
}
