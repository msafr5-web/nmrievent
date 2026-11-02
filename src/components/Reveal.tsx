"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * يُظهر العنصر بحركة خفيفة عند دخوله مجال الرؤية.
 * المحتوى ظاهر افتراضيًا (لمحركات البحث وبدون JavaScript)، ولا يُخفى إلا ما هو أسفل الشاشة عند التحميل.
 */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${state === "hidden" ? "opacity-0" : state === "shown" ? "animate-fade-up" : ""} ${className}`}
      style={state === "shown" ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
