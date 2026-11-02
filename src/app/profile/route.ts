import { NextResponse } from "next/server";

/**
 * رابط قصير ثابت لملف التعريف (يُرمَّز في QR). تحويل مؤقت (307) كي يمكن استبدال الملف
 * أو نقله لاحقًا دون إعادة طباعة الرمز.
 */
export function GET(req: Request) {
  return NextResponse.redirect(new URL("/files/nmr-events-profile.pdf", req.url), 307);
}
