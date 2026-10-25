import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
      <p className="font-display text-8xl font-bold text-gold" dir="ltr">404</p>
      <h1 className="mt-6 text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-muted">ربما نُقلت الصفحة أو أن الرابط غير صحيح.</p>
      <Link href="/" className="btn-primary mt-8">العودة للرئيسية</Link>
    </section>
  );
}
