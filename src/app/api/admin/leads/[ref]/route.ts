import { requireRole } from "@/server/auth";
import { mutate } from "@/server/db";
import { fail, ok, parse, unauthorized } from "@/server/http";
import { leadStageSchema } from "@/server/schemas";
import type { LeadStage } from "@/server/types";

type Ctx = { params: Promise<{ ref: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireRole("admin"))) return unauthorized();
  const p = await parse(req, leadStageSchema);
  if ("res" in p) return p.res;
  const { ref } = await params;
  const lead = await mutate((db) => {
    const l = db.leads.find((x) => x.reference === ref);
    if (!l) return null;
    l.stage = p.data.stage as LeadStage;
    l.firstResponseAt ??= new Date().toISOString();
    return l;
  });
  return lead ? ok({ lead }) : fail("الطلب غير موجود.", 404);
}
