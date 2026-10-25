import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { PortfolioExplorer } from "@/components/PortfolioExplorer";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "معرض الأعمال",
  description: "مؤتمرات ومعارض ومهرجانات وحفلات تدشين نفذتها nmrievent في مختلف مناطق المملكة.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero eyebrow="معرض الأعمال" title="أعمال صنعت أثرًا في كل منطقة" lead="استعرض مشاريعنا حسب القطاع ونوع الفعالية، واطّلع على التحدي والحل والنتائج بالأرقام." />
      <section className="container"><PortfolioExplorer projects={projects} /></section>
      <div className="mt-24"><CtaBand /></div>
    </>
  );
}
