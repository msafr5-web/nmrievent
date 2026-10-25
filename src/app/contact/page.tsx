import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { site } from "@/content/site";
import { whatsappLink } from "@/lib/rfq-shared";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "تواصل مع فريق nmrievent عبر واتساب أو البريد أو الهاتف، أو اطلب عرض سعر فوري.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const channels = [
    { icon: WhatsAppIcon, title: "واتساب الأعمال", text: "أسرع طريقة للتواصل، ردّ خلال دقائق في أوقات العمل.", href: whatsappLink(site.whatsapp, "مرحبًا nmrievent"), cta: "ابدأ المحادثة", external: true },
    { icon: MailIcon, title: "البريد الإلكتروني", text: site.email, href: `mailto:${site.email}`, cta: "أرسل بريدًا" },
    { icon: PhoneIcon, title: "الهاتف", text: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, cta: "اتصل بنا" },
    { icon: PinIcon, title: "المقر الرئيسي", text: site.city, href: "https://maps.google.com/?q=Riyadh", cta: "الخريطة", external: true },
  ];
  return (
    <>
      <PageHero eyebrow="تواصل معنا" title="لنصنع حدثك القادم معًا" lead="اختر القناة الأنسب لك، أو استخدم المهيّئ الذكي للحصول على تقدير فوري وعرض خلال ساعتين." >
        <Link href="/rfq" className="btn-primary mt-10">اطلب عرض سعر</Link>
      </PageHero>
      <section className="container grid gap-6 md:grid-cols-2">
        {channels.map((c) => (
          <a key={c.title} href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="card group flex items-start gap-5 p-8 transition hover:border-gold/60">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold/10 text-gold"><c.icon className="h-7 w-7" /></span>
            <div>
              <h2 className="text-xl font-bold">{c.title}</h2>
              <p className="mt-2 text-muted" dir="auto">{c.text}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-gold">{c.cta}</span>
            </div>
          </a>
        ))}
      </section>
    </>
  );
}
