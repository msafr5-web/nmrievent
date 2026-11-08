"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { galleryCategories, type GalleryCategory, type GalleryItem } from "@/content/gallery";
import { ArrowIcon, CloseIcon } from "./icons";

const ALL = "all";
type Filter = typeof ALL | GalleryCategory;

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [active, setActive] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const counts = useMemo(() => {
    const c = new Map<GalleryCategory, number>();
    for (const i of items) c.set(i.category, (c.get(i.category) ?? 0) + 1);
    return c;
  }, [items]);

  const visible = useMemo(() => (filter === ALL ? items : items.filter((i) => i.category === filter)), [items, filter]);
  const lead = galleryCategories.find((c) => c.id === filter)?.lead;

  const open = (index: number, el: HTMLElement) => {
    opener.current = el;
    setActive(index);
  };
  const close = useCallback(() => {
    setActive(null);
    opener.current?.focus();
  }, []);
  const step = useCallback(
    (dir: 1 | -1) => setActive((a) => (a === null ? a : (a + dir + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    if (active === null) return;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // اتجاه RTL: السهم الأيسر = التالي
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(1);
      else if (e.key === "ArrowRight") step(-1);
      else if (e.key === "Tab") {
        // حبس التركيز داخل النافذة
        const nodes = document.querySelectorAll<HTMLElement>("[data-lightbox] button");
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close, step]);

  const current = active === null ? null : visible[active];

  return (
    <>
      <div role="radiogroup" aria-label="تصنيف الأعمال" className="flex flex-wrap gap-2">
        {([[ALL, "كل الأعمال", items.length], ...galleryCategories.map((c) => [c.id, c.label, counts.get(c.id) ?? 0] as const)] as const).map(
          ([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              onClick={() => setFilter(id as Filter)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                filter === id ? "border-brand bg-brand text-bg" : "border-line text-muted hover:border-brand hover:text-fg"
              }`}
            >
              {label} <span className="opacity-70">({n})</span>
            </button>
          ),
        )}
      </div>
      <p className="mt-5 min-h-7 text-muted" aria-live="polite">
        {lead ?? "مختارات من مشاريعنا في تصميم الأجنحة والطباعة والكوادر وإدارة الحشود والهوية البصرية."}
      </p>

      <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {visible.map((item, i) => (
          <li key={item.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={(e) => open(i, e.currentTarget)}
              aria-label={`تكبير الصورة: ${item.alt}`}
              className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-elevated text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                loading={i < 6 ? "eager" : "lazy"}
                unoptimized={item.src.startsWith("/media/")}
                className="h-auto w-full transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-4 text-sm leading-6 text-white transition duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0">
                {item.alt}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          data-lightbox
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm text-white/70" dir="ltr">
              {(active ?? 0) + 1} / {visible.length}
            </span>
            <button ref={closeRef} type="button" onClick={close} aria-label="إغلاق" className="grid h-11 w-11 place-items-center rounded-full border border-white/30 hover:border-brand hover:text-brand">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-20" onClick={(e) => e.target === e.currentTarget && close()}>
            <button type="button" onClick={() => step(-1)} aria-label="الصورة السابقة" className="absolute start-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-black/40 text-white hover:border-brand hover:text-brand md:start-6">
              <ArrowIcon className="h-5 w-5 rotate-180" />
            </button>
            <Image
              key={current.id}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="100vw"
              unoptimized={current.src.startsWith("/media/")}
              priority
              className="max-h-full w-auto max-w-full rounded-xl object-contain"
            />
            <button type="button" onClick={() => step(1)} aria-label="الصورة التالية" className="absolute end-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-black/40 text-white hover:border-brand hover:text-brand md:end-6">
              <ArrowIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="p-4 text-center text-white/90">{current.alt}</p>
        </div>
      )}
    </>
  );
}
