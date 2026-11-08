import type { Metadata } from "next";
import { ExhibitionApplyForm } from "@/components/ExhibitionApplyForm";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "طلب مشاركة في معرض",
  description: "قدّم طلب مشاركة في معرض: تصميم الجناح وتنفيذه والطباعة والكوادر والحلول التقنية مع NMR Events.",
  alternates: { canonical: "/exhibition-apply" },
};

export default function ExhibitionApplyPage() {
  return (
    <>
      <PageHero
        eyebrow="المعارض"
        title={<>شاركنا في <span className="text-brand">معرضك القادم</span></>}
        lead="أخبرنا عن المعرض ومساحة الجناح والخدمات التي تحتاجها، وسيراجع فريق المعارض طلبك ويعود إليك."
      />
      <section className="container"><ExhibitionApplyForm /></section>
    </>
  );
}
