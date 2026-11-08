import type { Metadata } from "next";
import { phones } from "@/content/site";

export const metadata: Metadata = { title: "لا يوجد اتصال", robots: { index: false } };

export default function OfflinePage() {
  return (
    <section className="container flex min-h-[70svh] flex-col items-center justify-center py-32 text-center">
      <h1 className="text-4xl font-bold">لا يوجد اتصال بالإنترنت</h1>
      <p className="mt-5 max-w-md text-lg leading-8 text-muted">
        تعذّر تحميل هذه الصفحة. يمكنك تصفح الصفحات التي زرتها مسبقًا، أو الاتصال بنا مباشرة:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {phones.map((p) => (
          <a key={p.tel} href={`tel:${p.tel}`} dir="ltr" className="btn-primary">{p.display}</a>
        ))}
      </div>
    </section>
  );
}
