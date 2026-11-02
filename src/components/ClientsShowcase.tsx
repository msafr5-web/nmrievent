import Image from "next/image";
import { siteImages } from "@/content/gallery";
import { SectionHeading } from "./SectionHeading";

/** شبكتا شعارات الشركاء والعملاء من ملف تعريف الشركة؛ تُعرضان داخل بطاقة فاتحة لأن الشعارات مصممة على خلفية بيضاء */
export function ClientsShowcase() {
  const { "partners-panel": partners, "clients-panel": clients } = siteImages;
  return (
    <section className="container mt-28" aria-labelledby="clients-title">
      <SectionHeading
        eyebrow="شركاء النجاح"
        title={<span id="clients-title">شركاؤنا <span className="text-gold">وعملاؤنا</span></span>}
        lead="نخدم نخبة من الجهات الحكومية والشركات الكبرى في مختلف القطاعات."
      />
      <div className="grid gap-6">
        <figure className="overflow-hidden rounded-3xl border border-line bg-white">
          <figcaption className="px-5 py-3 text-sm font-semibold text-neutral-700 md:px-6">شركاؤنا</figcaption>
          <Image src={partners.src} alt="شعارات شركائنا: إنفيلد رويال كلينكس، جمعية سفراء التراث، ذا كارنيفور، لكزس، جيتور، مصرف الراجحي، إكسكلوسيف، عبد اللطيف جميل للسيارات، ديلويت، أوكتانورم، تنويل" width={partners.width} height={partners.height} sizes="(min-width: 1280px) 1216px, 100vw" className="h-auto w-full" />
        </figure>
        <figure className="overflow-hidden rounded-3xl border border-line bg-white">
          <figcaption className="px-5 py-3 text-sm font-semibold text-neutral-700 md:px-6">عملاؤنا</figcaption>
          <Image src={clients.src} alt="شعارات عملائنا من الجهات الحكومية والشركات الكبرى" width={clients.width} height={clients.height} sizes="(min-width: 1280px) 1216px, 100vw" className="h-auto w-full" />
        </figure>
      </div>
    </section>
  );
}
