import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** فحص حيوية للحاويات وموازنات الحمل؛ لا يلمس قاعدة البيانات عمدًا حتى لا يُسقط الخدمة عند بطء القاعدة */
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
