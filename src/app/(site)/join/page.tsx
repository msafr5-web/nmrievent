import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { StaffRegistration } from "@/components/StaffRegistration";

export const metadata: Metadata = {
  title: "انضم إلى فريق الكوادر",
  description: "سجّل في قاعدة كوادر nmrievent الميدانية للعمل في أهم الفعاليات الوطنية والترفيهية في المملكة.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <>
      <PageHero
        eyebrow="الكوادر الميدانية"
        title={<>انضم إلى فريق <span className="text-gold">الكوادر المحترفة</span> للفعاليات</>}
        lead="سجل بياناتك الشخصية والتعليمية لتكون جزءًا من أهم الفعاليات الوطنية والترفيهية في المملكة. التحقق يتم عبر رمز يصل بريدك، وتحصل فورًا على بطاقة QR للتحضير."
      />
      <section className="container"><StaffRegistration /></section>
    </>
  );
}
