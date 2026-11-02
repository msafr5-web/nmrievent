import { NextResponse } from "next/server";
import { parseServerEnv } from "@/lib/env";
import { estimate } from "@/lib/estimator";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rate-limit";
import { createRedisRateLimiter } from "@/lib/rate-limit-redis";
import { rfqSchema } from "@/lib/rfq";
import { referenceNumber } from "@/lib/rfq-shared";
import { getLeadRepository, getWebhook } from "@/server/rfq/container";
import { submitLead } from "@/server/rfq/submit-lead";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const UNAVAILABLE = "تعذر استلام طلبك حاليًا. يرجى التواصل معنا عبر واتساب أو إعادة المحاولة بعد قليل.";

const env = parseServerEnv();
const repo = getLeadRepository(env);
const webhook = getWebhook(env);
const rateOpts = { limit: env.RFQ_RATE_LIMIT, windowMs: env.RFQ_RATE_WINDOW_MS };
const memoryLimiter = createRateLimiter(rateOpts);
const redisLimiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? createRedisRateLimiter({ ...rateOpts, url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null;

// Redis أولًا (موزّع)؛ عند تعطله نرجع للذاكرة بدل إيقاف النموذج
async function isRateLimited(ip: string) {
  if (redisLimiter) {
    try {
      return await redisLimiter.isLimited(ip);
    } catch (err) {
      logger.warn({ err: err instanceof Error ? err.message : String(err) }, "redis rate limiter failed, using memory fallback");
    }
  }
  return memoryLimiter.isLimited(ip);
}

// x-real-ip تضبطه المنصة (Vercel وغيرها)؛ x-forwarded-for احتياطي ويُؤخذ أول عنصر فقط
function clientIp(req: Request) {
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (await isRateLimited(ip)) {
    logger.warn({ ip }, "rfq rate limited");
    return json({ error: "عدد كبير من الطلبات، حاول بعد قليل." }, 429);
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ error: "حجم الطلب كبير جدًا." }, 413);

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: "حجم الطلب كبير جدًا." }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: "صيغة الطلب غير صالحة." }, 400);
  }

  const parsed = rfqSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fields[key] ??= issue.message;
    }
    return json({ error: "يرجى مراجعة الحقول المطلوبة.", fields }, 422);
  }

  const data = parsed.data;
  // الحقل الفخ مُعبأ = بوت؛ نرد بنجاح وهمي دون معالجة
  if (data.company_site) {
    logger.info({ ip }, "rfq honeypot triggered");
    return json({ reference: referenceNumber(), estimate: { low: 0, high: 0 } }, 201);
  }

  const est = estimate(data);
  const reference = referenceNumber();
  const lead = { reference, receivedAt: new Date().toISOString(), estimate: est, ...data, company_site: undefined };

  if (!repo && !webhook) {
    // في الإنتاج لا نُعلم العميل بالنجاح دون وجهة تحفظ الطلب، حتى لا يضيع Lead
    if (env.NODE_ENV === "production") {
      logger.error({ reference }, "rfq rejected: neither DATABASE_URL nor RFQ_WEBHOOK_URL is configured");
      return json({ error: UNAVAILABLE }, 503);
    }
    logger.info({ reference, organization: data.organization, mid: est.mid }, "rfq received (no storage, dev mode)");
  } else {
    try {
      const outcome = await submitLead(lead, { repo, webhook });
      if (outcome === "queued") logger.warn({ reference }, "rfq stored; webhook delivery queued for retry");
    } catch (err) {
      logger.error({ reference, err: err instanceof Error ? err.message : String(err) }, "rfq submission failed");
      return json({ error: UNAVAILABLE }, 503);
    }
  }

  return json({ reference, estimate: { low: est.low, high: est.high } }, 201);
}
