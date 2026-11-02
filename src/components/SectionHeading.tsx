import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-4 text-balance text-3xl font-bold leading-tight md:text-5xl">{title}</h2>
        {lead && <p className="mt-5 text-lg leading-8 text-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}
