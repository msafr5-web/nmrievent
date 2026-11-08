export const PROFILE_PDF_PATH = "/files/nmr-events-profile.pdf";

/**
 * رابط قصير ثابت لملف التعريف (يُرمَّز في QR). تحويل مؤقت (307) كي يمكن استبدال الملف
 * أو نقله لاحقًا دون إعادة طباعة الرمز.
 *
 * التحويل بمسار نسبي عمدًا: خلف الوكيل العكسي يكون req.url عنوانًا داخليًا (مثل 0.0.0.0:3000)،
 * وبناء رابط مطلق منه كان يكسر الرمز على الخادم الفعلي. الترويسة Location النسبية صالحة وفق RFC 9110.
 */
export function GET() {
  return new Response(null, { status: 307, headers: { Location: PROFILE_PDF_PATH, "Cache-Control": "no-store" } });
}
