import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { audit } from "@/server/admin/audit";
import { getApplication } from "@/server/admin/applications";
import { authorize, clientIp, requireDb, serverEnv } from "@/server/admin/context";
import { resolveCvPath } from "@/server/admin/media";
import { actorOf, AdminError } from "@/server/admin/users";

export const runtime = "nodejs";

/** تنزيل السيرة الذاتية: للمراجعين المصرَّح لهم فقط (staff.view)، كمرفق، وكل تنزيل يُسجَّل في سجل النشاط */
export async function GET(_req: Request, ctx: { params: Promise<{ ref: string }> }) {
  let user;
  try {
    user = await authorize("staff.view");
  } catch (e) {
    return NextResponse.json({ error: e instanceof AdminError ? e.message : "غير مصرح." }, { status: 403 });
  }
  const { ref } = await ctx.params;
  const db = requireDb();
  const detail = await getApplication(db, ref.toUpperCase());
  const rel = detail?.application.attachment;
  const full = rel ? resolveCvPath(serverEnv().UPLOAD_DIR, rel) : null;
  if (!detail || !full) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(full);
    await audit(db, actorOf(user), "application.cv_download", { entity: "application", entityId: detail.application.reference, ip: await clientIp() });
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cv-${detail.application.reference}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
