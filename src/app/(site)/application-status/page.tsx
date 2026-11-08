import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { StatusLookup } from "@/components/StatusLookup";

export const metadata: Metadata = {
  title: "متابعة الطلب",
  description: "تابع حالة طلبك والملاحظات الموجهة إليك برقم الطلب ورقم الجوال.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/application-status" },
};

export default async function ApplicationStatusPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <>
      <PageHero eyebrow="متابعة الطلب" title={<>أين وصل <span className="text-brand">طلبك؟</span></>} lead="أدخل رقم الطلب الذي استلمته ورقم الجوال المسجَّل فيه لتعرف حالته وتقرأ ملاحظات الفريق." />
      <section className="container"><StatusLookup initialRef={(ref ?? "").slice(0, 20)} /></section>
    </>
  );
}
