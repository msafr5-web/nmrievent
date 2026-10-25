import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="nmrievent — الصفحة الرئيسية">
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
        <rect x="1" y="1" width="38" height="38" rx="11" className="fill-gold" />
        {/* نجمة ثمانية مستوحاة من الزخرفة النجدية */}
        <path
          d="M20 8l3.2 5.6L29.5 12l-1.6 6.3L33 22l-5.6 3.2L29 31.5l-6.3-1.6L20 36l-3.2-5.6L10.5 32l1.6-6.3L7 22l5.6-3.2L11 12.5l6.3 1.6z"
          className="fill-bg transition-transform duration-700 group-hover:rotate-45"
          style={{ transformOrigin: "20px 22px" }}
          transform="translate(0 -2)"
        />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight" dir="ltr">
        nmri<span className="text-gold">event</span>
      </span>
    </Link>
  );
}
