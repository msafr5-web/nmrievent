import { NextResponse } from "next/server";
import { estimate } from "@/lib/estimator";
import { rfqSchema } from "@/lib/rfq";
import { referenceNumber } from "@/lib/rfq-shared";
import { mutate } from "@/server/db";
import { notify } from "@/server/http";

// حد بسيط للطلبات لكل IP (في الإنتاج يُستبدل بـ Redis كما في الوثيقة)
const hits = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "عدد كبير من الطلبات، حاول بعد قليل." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "صيغة الطلب غير صالحة." }, { status: 400 });
  }

  const parsed = rfqSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fields[key] ??= issue.message;
    }
    return NextResponse.json({ error: "يرجى مراجعة الحقول المطلوبة.", fields }, { status: 422 });
  }

  const data = parsed.data;
  // الحقل الفخ مُعبأ = بوت؛ نرد بنجاح دون معالجة
  if (data.company_site) return NextResponse.json({ reference: referenceNumber(), estimate: { low: 0, high: 0 } }, { status: 201 });

  const est = estimate(data);
  const reference = referenceNumber();
  const lead = { reference, receivedAt: new Date().toISOString(), estimate: est, ...data };

  // حفظ الطلب في خط المبيعات (CRM) بمرحلة "طلب جديد"
  const { consent: _c, company_site: _h, ...fields } = data;
  void _c;
  void _h;
  await mutate((db) => void db.leads.unshift({ ...fields, reference, receivedAt: lead.receivedAt, stage: "new", estimate: est }));

  const webhook = process.env.RFQ_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
    } catch (err) {
      console.error("[rfq] webhook failed", err);
    }
  }
  await notify("rfq.received", { reference, organization: data.organization, email: data.email, phone: data.phone });

  return NextResponse.json({ reference, estimate: { low: est.low, high: est.high } }, { status: 201 });
}
