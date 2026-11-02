import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-36 md:pb-20 md:pt-44">
      <div className="sadu absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="absolute end-0 top-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" aria-hidden />
      <div className="container relative">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold leading-[1.15] md:text-6xl">{title}</h1>
        {lead && <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
