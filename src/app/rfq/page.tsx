import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { RfqConfigurator } from "@/components/RfqConfigurator";

export const metadata: Metadata = {
  title: "اطلب عرض سعر — مهيّئ الفعاليات الذكي",
  description: "صمّم فعاليتك خلال دقائق واحصل على تقدير مبدئي فوري للتكلفة، ويتواصل معك مستشارنا خلال ساعتين.",
  alternates: { canonical: "/rfq" },
};

export default function RfqPage() {
  return (
    <>
      <PageHero
        eyebrow="مهيّئ الفعاليات الذكي"
        title={<>صمّم فعاليتك، واحصل على <span className="text-gold">تقدير فوري</span></>}
        lead="خمس خطوات قصيرة تمنحك تقديرًا مبدئيًا للتكلفة، ويصلك عرض تفصيلي من مستشارنا خلال ساعتين."
      />
      <section className="container">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <RfqConfigurator />
        </Suspense>
      </section>
    </>
  );
}
