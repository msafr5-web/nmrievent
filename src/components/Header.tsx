"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/content/site";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { CloseIcon, MenuIcon } from "./icons";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-line/70 bg-bg/85 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-bg">
        تخطَّ إلى المحتوى
      </a>
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm transition ${
                isActive(item.href) ? "text-gold" : "text-muted hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/rfq" className="btn-primary hidden sm:inline-flex">
            اطلب عرض سعر
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div
        id="mobile-nav"
        className={`lg:hidden ${open ? "block" : "hidden"} h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-bg`}
      >
        <nav className="container flex flex-col gap-1 py-6" aria-label="التنقل في الجوال">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-4 font-display text-2xl ${isActive(item.href) ? "text-gold" : "text-fg"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/rfq" className="btn-primary mt-6 py-4 text-base">
            اطلب عرض سعر
          </Link>
        </nav>
      </div>
    </header>
  );
}
