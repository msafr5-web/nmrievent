import Link from "next/link";
import { nav, site } from "@/content/site";
import { services } from "@/content/services";
import { Logo } from "./Logo";
import { MailIcon, PhoneIcon, PinIcon } from "./icons";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line bg-surface">
      <div className="sadu absolute inset-x-0 top-0 h-2 opacity-80" aria-hidden />
      <div className="container grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-sm leading-8 text-muted">{site.description}</p>
        </div>
        <div className="md:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-fg">الموقع</h2>
          <ul className="space-y-3 text-sm text-muted">
            {nav.map((n) => (
              <li key={n.href}><Link className="hover:text-gold" href={n.href}>{n.label}</Link></li>
            ))}
            <li><Link className="hover:text-gold" href="/login">بوابة العملاء والفرق</Link></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-fg">الخدمات</h2>
          <ul className="space-y-3 text-sm text-muted">
            {services.map((s) => (
              <li key={s.slug}><Link className="hover:text-gold" href={`/services/${s.slug}`}>{s.title}</Link></li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-fg">تواصل معنا</h2>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-center gap-2"><PinIcon className="h-4 w-4 text-gold" />{site.city}</li>
            <li className="flex items-center gap-2"><MailIcon className="h-4 w-4 text-gold" /><a href={`mailto:${site.email}`} className="hover:text-gold">{site.email}</a></li>
            <li className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-gold" /><a href={`tel:${site.phone.replace(/\s/g, "")}`} dir="ltr" className="hover:text-gold">{site.phone}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} nmrievent. جميع الحقوق محفوظة.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold">سياسة الخصوصية</Link>
            <span>البيانات مستضافة داخل المملكة وفق نظام حماية البيانات الشخصية</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
