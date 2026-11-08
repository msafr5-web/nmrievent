"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/(admin)/admin/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CloseIcon, MenuIcon } from "@/components/icons";

export type NavItem = { href: string; label: string; badge?: number };

type Props = { items: NavItem[]; user: { name: string; email: string; isSuper: boolean } };

/** الشريط الجانبي (سطح المكتب) والقائمة المنسدلة (الجوال) للوحة التحكم */
export function AdminNav({ items, user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState(pathname);
  if (prev !== pathname) {
    setPrev(pathname);
    setOpen(false);
  }
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const links = (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${active(i.href) ? "bg-brand text-bg" : "text-muted hover:bg-elevated hover:text-fg"}`}
          >
            <span>{i.label}</span>
            {i.badge ? (
              <span className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold ${active(i.href) ? "bg-bg/20 text-bg" : "bg-brand text-bg"}`}>{i.badge}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );

  const account = (
    <div className="mt-6 border-t border-line pt-5">
      <p className="truncate text-sm font-semibold">{user.name}</p>
      <p className="truncate text-xs text-muted" dir="ltr">{user.email}</p>
      {user.isSuper && <span className="mt-2 inline-block rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">المدير الأعلى</span>}
      <form action={logoutAction} className="mt-4">
        <button type="submit" className="btn-ghost w-full">تسجيل الخروج</button>
      </form>
    </div>
  );

  const logo = (
    <Link href="/admin" aria-label="لوحة التحكم" className="inline-flex items-center gap-3">
      <Image src="/images/brand/nmr-logo-on-light.png" alt="NMR Events" width={722} height={331} className="h-10 w-auto dark:hidden" />
      <Image src="/images/brand/nmr-logo.png" alt="NMR Events" width={722} height={331} className="hidden h-10 w-auto dark:block" />
    </Link>
  );

  return (
    <>
      {/* سطح المكتب */}
      <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 flex-col overflow-y-auto border-e border-line bg-surface p-5 lg:flex" aria-label="التنقل في لوحة التحكم">
        <div className="mb-6 flex items-center justify-between">{logo}<ThemeToggle /></div>
        <nav className="flex-1">{links}</nav>
        {account}
      </aside>

      {/* الجوال */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {logo}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" aria-expanded={open} aria-controls="admin-drawer" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-line">
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div id="admin-drawer" className={`${open ? "block" : "hidden"} max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-line bg-surface p-4`}>
          <nav aria-label="التنقل في لوحة التحكم">{links}</nav>
          {account}
        </div>
      </header>
    </>
  );
}
