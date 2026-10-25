import { NextResponse } from "next/server";
import { read } from "@/server/db";
import { safeEqual } from "@/server/auth";
import { clientIp, fail, limited, parse } from "@/server/http";
import { loginSchema } from "@/server/schemas";
import { sessionCookie, signSession, type Session } from "@/lib/session";

const devPassword = (role: "admin" | "ops") =>
  process.env[role === "admin" ? "ADMIN_PASSWORD" : "OPS_PASSWORD"] ??
  (process.env.NODE_ENV === "production" ? undefined : role === "admin" ? "admin123" : "ops123");

export async function POST(req: Request) {
  if (limited(`login:${clientIp(req)}`, 10, 10 * 60_000)) return fail("محاولات كثيرة، حاول بعد قليل.", 429);
  const p = await parse(req, loginSchema);
  if ("res" in p) return p.res;
  const input = p.data;

  let session: Session | null = null;
  if (input.role === "client") {
    const db = await read();
    const ref = input.reference.toUpperCase();
    const project = db.projects.find((x) => x.reference === ref && x.clientEmail === input.email);
    const lead = db.leads.find((x) => x.reference === ref && x.email.toLowerCase() === input.email);
    if (project || lead) session = { role: "client", sub: ref, name: lead?.organization ?? project?.entity ?? "عميل" };
  } else {
    const expected = devPassword(input.role);
    if (expected && safeEqual(input.password, expected))
      session = { role: input.role, sub: input.role, name: input.role === "admin" ? "الإدارة العليا" : "فريق العمليات" };
  }

  if (!session) return fail("بيانات الدخول غير صحيحة.", 401);
  const res = NextResponse.json({ ok: true, role: session.role });
  res.cookies.set(sessionCookie(await signSession(session)));
  return res;
}
