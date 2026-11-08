import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getLeadRepository, getWebhook } from "@/server/rfq/container";
import { purgeRejectedApplications } from "@/server/admin/applications";
import { deleteCvFile } from "@/server/admin/media";
import { retryPending } from "@/server/rfq/submit-lead";
import { getPool } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request, secret: string) {
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** مهمة مجدولة (cron): إعادة تسليم المعلّق + حذف الطلبات المنتهية بعد مدة الاحتفاظ. الاستدعاء بـ Authorization: Bearer <CRON_SECRET> */
async function handle(req: Request) {
  const env = parseServerEnv();
  const repo = getLeadRepository(env);
  const webhook = getWebhook(env);

  // بدون سر مضبوط تُغلق النقطة تمامًا بدل أن تُترك مفتوحة
  if (!env.CRON_SECRET || !authorized(req, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!repo) {
    return NextResponse.json({ error: "DATABASE_URL is required" }, { status: 409 });
  }

  try {
    // إعادة التسليم تتطلب webhook؛ أما حذف المنتهي بحسب سياسة الاحتفاظ فيعمل دائمًا
    const retried = webhook ? await retryPending(repo, webhook) : { claimed: 0, delivered: 0, failed: 0 };
    const purged = await repo.purgeOlderThan(env.RFQ_RETENTION_DAYS);
    // طلبات التقديم المرفوضة تُحذف بعد APPLICATION_RETENTION_DAYS مع سيرها الذاتية (سياسة الاحتفاظ)
    const pool = getPool(env.DATABASE_URL);
    const apps = pool ? await purgeRejectedApplications(pool, env.APPLICATION_RETENTION_DAYS) : { deleted: 0, attachments: [] as string[] };
    for (const rel of apps.attachments) await deleteCvFile(env.UPLOAD_DIR, rel);
    const result = { ...retried, purged, applicationsPurged: apps.deleted };
    logger.info(result, "rfq cron run");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "rfq retry run failed");
    return NextResponse.json({ error: "Retry run failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
