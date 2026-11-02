import Link from "next/link";
import { phones } from "@/content/site";
import { ArrowIcon, PhoneIcon } from "./icons";

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
          <div className="flex flex-col items-start gap-4 md:items-end">
            <Link href="/rfq" className="btn-primary px-8 py-4 text-base">
              ابدأ تهيئة فعاليتك <ArrowIcon className="h-5 w-5" />
            </Link>
            <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span>أو اتصل بنا مباشرة:</span>
              {phones.map((ph) => (
                <a key={ph.tel} href={`tel:${ph.tel}`} dir="ltr" className="inline-flex items-center gap-1.5 font-semibold text-fg hover:text-gold">
                  <PhoneIcon className="h-4 w-4 text-gold" />{ph.display}
                </a>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
