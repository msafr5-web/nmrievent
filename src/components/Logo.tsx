import Image from "next/image";
import Link from "next/link";

/**
 * شعار NMR Events الرسمي. نسختان تتبدلان مع الوضع:
 * الملوّن (حروف بيضاء) فوق الكحلي في الداكن، ونسخة الحروف الكحلية في الفاتح.
 * الأبعاد 722×331؛ الحد الأدنى للعرض 96px (هنا 112–122px) (انظر /brand).
 */
export function Logo({ className = "" }: { className?: string }) {
  const size = { width: 722, height: 331, sizes: "(min-width: 768px) 140px, 112px", className: "h-12 w-auto md:h-14" } as const;
  return (
    <Link href="/" className={`inline-flex items-center rounded-lg transition hover:opacity-90 ${className}`} aria-label="NMR Events — الصفحة الرئيسية">
      <Image src="/images/brand/nmr-logo-on-light.png" alt="NMR Events" {...size} priority className={`${size.className} dark:hidden`} />
      <Image src="/images/brand/nmr-logo.png" alt="NMR Events" {...size} priority className={`${size.className} hidden dark:block`} />
    </Link>
  );
}
