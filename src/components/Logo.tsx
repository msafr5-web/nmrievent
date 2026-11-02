import Image from "next/image";
import Link from "next/link";
import { logoImage } from "@/content/gallery";

/**
 * شعار الشركة الرسمي (من ملف التعريف). حروفه بيضاء، فيوضع داخل لوحة كحلية
 * بلون هوية الشركة ليبقى مقروءًا في الوضعين الفاتح والداكن.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center rounded-xl bg-[#0b0f3b] px-3 py-1.5 ring-1 ring-white/10 transition hover:ring-gold/60 ${className}`} aria-label="NMR Events — الصفحة الرئيسية">
      <Image src={logoImage.src} alt="NMR Events" width={logoImage.width} height={logoImage.height} priority sizes="96px" className="h-9 w-auto" />
    </Link>
  );
}
