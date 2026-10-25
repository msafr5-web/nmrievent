import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "سياسة الخصوصية", alternates: { canonical: "/privacy" } };

// نص مبدئي — يجب مراجعته قانونيًا قبل الإطلاق
const sections = [
  { h: "البيانات التي نجمعها", p: "الاسم، الجهة، البريد الإلكتروني، رقم الجوال، وتفاصيل الفعالية التي تدخلها في نموذج طلب العرض." },
  { h: "الغرض من المعالجة", p: "إعداد عرض السعر، التواصل معك بخصوص طلبك، وتحسين خدماتنا. لا نبيع بياناتك لأي طرف ثالث." },
  { h: "مكان الحفظ", p: "تُحفظ البيانات على خوادم داخل المملكة العربية السعودية التزامًا بنظام حماية البيانات الشخصية (PDPL)، وتُنقل مشفرة عبر SSL." },
  { h: "حقوقك", p: `يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت عبر ${site.email}.` },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="الخصوصية" title="سياسة الخصوصية" lead="نلتزم بحماية بياناتك وفق نظام حماية البيانات الشخصية في المملكة العربية السعودية." />
      <section className="container max-w-3xl space-y-10">
        {sections.map((s) => (
          <div key={s.h}>
            <h2 className="text-2xl font-bold">{s.h}</h2>
            <p className="mt-3 text-lg leading-9 text-muted">{s.p}</p>
          </div>
        ))}
      </section>
    </>
  );
}
