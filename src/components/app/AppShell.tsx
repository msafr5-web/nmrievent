import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { LogoutButton } from "./LogoutButton";

export function AppShell({ title, subtitle, user, links, children }: {
  title: string;
  subtitle?: string;
  user?: string;
  links?: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo />
            {links && (
              <nav className="hidden gap-1 md:flex" aria-label="أقسام المنصة">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-elevated hover:text-fg">{l.label}</Link>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && <span className="hidden text-sm text-muted sm:inline">{user}</span>}
            <ThemeToggle />
            {user && <LogoutButton />}
          </div>
        </div>
      </header>
      <main id="main" className="container py-8 md:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
