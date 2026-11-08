import type { Metadata } from "next";
import { CareersForm } from "@/components/CareersForm";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "انضم لفريقنا",
  description: "قدّم طلب الانضمام إلى كوادر NMR Events الميدانية: مضيفون ومنظمون وإدارة حشود وأمن وفنيون.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="انضم إلينا"
        title={<>كن جزءًا من <span className="text-brand">فريق الفعاليات</span></>}
        lead="نبحث عن كوادر شغوفة بالفعاليات والمعارض. أرسل بياناتك، وسيراجعها فريقنا ويتواصل معك، وتتابع حالة طلبك برقمه."
      />
      <section className="container"><CareersForm /></section>
    </>
  );
}
