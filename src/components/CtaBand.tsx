import Link from "next/link";
import { ArrowIcon } from "./icons";

export function CtaBand() {
  return (
    <section className="container">
      <div className="relative overflow-hidden rounded-[2rem] border border-gold/30 bg-elevated px-6 py-14 md:px-16 md:py-20">
        <div className="sadu absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute -start-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-balance text-3xl font-bold leading-tight md:text-4xl">
              فعاليتك القادمة تبدأ بخمس دقائق
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              صمّم فعاليتك عبر المهيّئ الذكي واحصل على تقدير مبدئي فوري، ويتواصل معك مستشارنا خلال ساعتين.
            </p>
          </div>
          <Link href="/rfq" className="btn-primary px-8 py-4 text-base">
            ابدأ تهيئة فعاليتك <ArrowIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
