import Link from "next/link";
import { Counter } from "@/components/Counter";
import { CtaBand } from "@/components/CtaBand";
import { ArrowIcon, serviceIcons } from "@/components/icons";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { insights } from "@/content/insights";
import { projects } from "@/content/projects";
import { services } from "@/content/services";
import { journey, sectors, stats } from "@/content/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <ServicesGrid />
      <Journey />
      <FeaturedWork />
      <Audiences />
      <LatestInsights />
      <div className="mt-24">
        <CtaBand />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-16 pt-32 md:items-center md:pb-0">
      {/* خلفية "ريل" متحركة خفيفة بدل الفيديو الثقيل؛ يمكن استبدالها بفيديو lazy */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgb(var(--gold)/.28),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgb(var(--palm)/.30),transparent_50%)]" />
        <div className="sadu absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <svg className="absolute -end-40 top-1/2 h-[900px] w-[900px] -translate-y-1/2 animate-[spin_120s_linear_infinite] opacity-40" viewBox="0 0 400 400">
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx="200" cy="200" r={30 + i * 15} fill="none" stroke="rgb(var(--gold))" strokeOpacity={0.5 - i * 0.035} strokeDasharray={i % 2 ? "2 6" : "none"} />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <div className="container">
        <div className="max-w-4xl">
          <span className="eyebrow animate-fade-up">شريكك المتكامل للفعاليات في المملكة</span>
          <h1 className="mt-6 animate-fade-up text-balance text-5xl font-bold leading-[1.1] [animation-delay:100ms] sm:text-6xl lg:text-7xl">
            نصنع فعاليات <span className="text-gold">تليق بطموح</span> المملكة
          </h1>
          <p className="mt-7 max-w-2xl animate-fade-up text-lg leading-9 text-muted [animation-delay:200ms] md:text-xl">
            إبداع فني، حلول رقمية تفاعلية، إدارة حشود ولوجستيات، وكوادر ميدانية مؤهلة. منصة واحدة تدير فعاليتك من الفكرة إلى قياس الأثر.
          </p>
          <div className="mt-10 flex animate-fade-up flex-wrap gap-3 [animation-delay:300ms]">
            <Link href="/rfq" className="btn-primary px-8 py-4 text-base">
              صمّم فعاليتك واحصل على تقدير فوري <ArrowIcon className="h-5 w-5" />
            </Link>
            <Link href="/portfolio" className="btn-ghost px-8 py-4 text-base">شاهد أعمالنا</Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 hidden overflow-hidden border-t border-line/60 bg-bg/60 py-4 backdrop-blur md:block" aria-hidden>
        <div className="flex w-max animate-drift gap-12 whitespace-nowrap text-sm text-muted">
          {[...Array(2)].flatMap((_, k) =>
            ["مؤتمرات دولية", "معارض وأجنحة", "حفلات تدشين", "تفعيل علامات تجارية", "مهرجانات ومواسم", "هولوجرام وواقع معزز", "إدارة حشود", "مضيفون وكوادر"].map((t) => (
              <span key={`${k}-${t}`} className="flex items-center gap-12">{t}<span className="text-gold">✦</span></span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="container relative z-10 mt-8 md:mt-20">
      <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`p-6 md:p-10 ${i % 2 ? "border-s border-line" : ""} ${i > 1 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-s" : ""}`}>
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-3 font-display text-4xl font-bold text-gold md:text-5xl">
              <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ServicesGrid() {
  return (
    <section className="container mt-28">
      <SectionHeading
        eyebrow="خدماتنا"
        title={<>خمس ركائز، <span className="text-gold">فريق واحد</span></>}
        lead="نجمع ما تحتاجه فعاليتك تحت إدارة واحدة، فلا تنسيق بين موردين متعددين ولا فجوات في المسؤولية."
        action={<Link href="/services" className="btn-ghost">كل الخدمات <ArrowIcon className="h-4 w-4" /></Link>}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {services.map((s, i) => {
          const Icon = serviceIcons[s.icon];
          return (
            <Reveal key={s.slug} delay={i * 80} className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}>
              <Link href={`/services/${s.slug}`} className="card group flex h-full flex-col p-8 transition hover:-translate-y-1 hover:border-gold/60">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold transition group-hover:bg-gold group-hover:text-bg">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-2xl font-bold">{s.title}</h3>
                <p className="mt-3 flex-1 leading-8 text-muted">{s.short}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold">
                  اكتشف المزيد <ArrowIcon className="h-4 w-4 transition group-hover:-translate-x-1" />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function Journey() {
  return (
    <section className="mt-28 border-y border-line bg-surface py-24">
      <div className="container">
        <SectionHeading
          eyebrow="منهجيتنا"
          title={<>رحلة الأثر: من <span className="text-gold">الفكرة</span> إلى <span className="text-gold">القياس</span></>}
          lead="أربع مراحل واضحة تتابعها لحظة بلحظة عبر بوابة العملاء، مع اعتمادات رقمية وتقارير في كل مرحلة."
        />
        <ol className="relative grid gap-6 md:grid-cols-4">
          <div className="absolute inset-x-0 top-7 hidden h-px bg-gradient-to-l from-gold via-gold/40 to-transparent md:block" aria-hidden />
          {journey.map((step, i) => (
            <Reveal key={step.key} delay={i * 120}>
              <li className="relative">
                <span className="relative grid h-14 w-14 place-items-center rounded-full border border-gold bg-bg font-display text-xl font-bold text-gold">
                  {(i + 1).toLocaleString("ar-SA-u-nu-latn")}
                </span>
                <h3 className="mt-6 text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 leading-8 text-muted">{step.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FeaturedWork() {
  const [first, second, ...rest] = projects;
  return (
    <section className="container mt-28">
      <SectionHeading
        eyebrow="أعمال مختارة"
        title="فعاليات تحدثت عنها الأرقام"
        action={<Link href="/portfolio" className="btn-ghost">معرض الأعمال <ArrowIcon className="h-4 w-4" /></Link>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal><ProjectCard project={first} large /></Reveal>
        <Reveal delay={100}><ProjectCard project={second} large /></Reveal>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.slice(0, 3).map((p, i) => (
          <Reveal key={p.slug} delay={i * 100}><ProjectCard project={p} /></Reveal>
        ))}
      </div>
    </section>
  );
}

function Audiences() {
  const items = [
    { title: "الجهات الحكومية", text: "موثوقية، التزام بالمعايير والبروتوكول، وخبرة في إدارة الحشود والمشاريع الوطنية الكبرى." },
    { title: "الشركات والعلامات التجارية", text: "تفعيل علامات تجارية، أجنحة مبتكرة، وتجارب رقمية تحوّل الحضور إلى عملاء." },
    { title: "منظمو الفعاليات", text: "كوادر ميدانية مؤهلة، جدولة فورية، وتقارير أداء لحظية لفرقك على الأرض." },
  ];
  return (
    <section className="container mt-28">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="eyebrow">لمن نعمل</span>
          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight md:text-5xl">شريك واحد لكل من يصنع الحدث</h2>
          <p className="mt-5 text-lg leading-8 text-muted">نخدم قطاعات متعددة بفرق متخصصة تفهم لغة كل قطاع ومتطلباته.</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {sectors.map((s) => (
              <li key={s} className="rounded-full border border-line px-4 py-2 text-sm text-muted">{s}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 lg:col-span-7">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 100}>
              <div className="card flex gap-6 p-7">
                <span className="font-display text-3xl font-bold text-gold/60">{`0${i + 1}`}</span>
                <div>
                  <h3 className="text-xl font-bold">{it.title}</h3>
                  <p className="mt-2 leading-8 text-muted">{it.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestInsights() {
  return (
    <section className="container mt-28">
      <SectionHeading
        eyebrow="رؤى وأفكار"
        title="من قلب صناعة الفعاليات السعودية"
        action={<Link href="/insights" className="btn-ghost">كل المقالات <ArrowIcon className="h-4 w-4" /></Link>}
      />
      <div className="grid gap-6 md:grid-cols-3">
        {insights.map((post, i) => (
          <Reveal key={post.slug} delay={i * 100}>
            <Link href={`/insights/${post.slug}`} className="card group block h-full p-7 transition hover:border-gold/60">
              <span className="text-xs font-semibold text-gold">{post.category}</span>
              <h3 className="mt-4 text-xl font-bold leading-snug transition group-hover:text-gold">{post.title}</h3>
              <p className="mt-3 leading-7 text-muted">{post.excerpt}</p>
              <p className="mt-6 text-xs text-muted">{post.readMinutes} دقائق قراءة</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
