import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";

/** إطار صفحات الدخول والإعداد والدعوة (بدون الشريط الجانبي) */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_15%,rgb(var(--violet)/.30),transparent_55%),radial-gradient(ellipse_at_10%_100%,rgb(var(--brand)/.22),transparent_50%)]" aria-hidden />
      <div className="absolute end-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image src="/images/brand/nmr-logo-on-light.png" alt="NMR Events" width={722} height={331} priority className="h-16 w-auto dark:hidden" />
          <Image src="/images/brand/nmr-logo.png" alt="NMR Events" width={722} height={331} priority className="hidden h-16 w-auto dark:block" />
        </div>
        {children}
      </div>
    </main>
  );
}
