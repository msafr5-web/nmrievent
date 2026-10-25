import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/CtaBand";
import { ArrowIcon } from "@/components/icons";
import { getInsight, insights } from "@/content/insights";
import { site } from "@/content/site";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => insights.map((i) => ({ slug: i.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getInsight((await params).slug);
  return p
    ? { title: p.title, description: p.excerpt, alternates: { canonical: `/insights/${p.slug}` }, openGraph: { type: "article", publishedTime: p.date } }
    : {};
}

export default async function InsightPage({ params }: Props) {
  const post = getInsight((await params).slug);
  if (!post) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    inLanguage: "ar",
    publisher: { "@type": "Organization", name: site.name },
  };

  return (
    <>
      <article className="container max-w-3xl pt-32 md:pt-40">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Link href="/insights" className="inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
          <ArrowIcon className="h-4 w-4 rotate-180" /> كل المقالات
        </Link>
        <p className="mt-8 text-sm font-semibold text-gold">{post.category}</p>
        <h1 className="mt-4 text-balance text-4xl font-bold leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-5 text-sm text-muted">
          {new Intl.DateTimeFormat("ar-SA-u-nu-latn", { dateStyle: "long", calendar: "gregory" }).format(new Date(post.date))} · {post.readMinutes} دقائق قراءة
        </p>
        <div className="mt-12 space-y-6 border-t border-line pt-10 text-lg leading-[2.1]">
          <p className="text-xl font-medium">{post.excerpt}</p>
          {post.body.map((para, i) => <p key={i} className="text-muted">{para}</p>)}
        </div>
      </article>
      <div className="mt-24"><CtaBand /></div>
    </>
  );
}
