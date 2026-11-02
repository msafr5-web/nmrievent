export const site = {
  name: "nmrievent",
  nameAr: "نمري إيفنت",
  tagline: "نصنع فعاليات تليق بطموح المملكة",
  description:
    "منصة متكاملة لتصميم وإدارة الفعاليات والمؤتمرات والمعارض في المملكة العربية السعودية: إبداع فني، حلول رقمية تفاعلية، إدارة حشود ولوجستيات، وكوادر ميدانية مؤهلة.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nmrievent.com",
  /** رقم واتساب (دولي بدون +). الافتراضي: الرقم الأول من ملف تعريف الشركة */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966547047635",
  email: "info@nmrevent.com",
  /** الرقم الرئيسي (للبيانات المنظمة وJSON-LD) */
  phone: "+966 54 704 7635",
  city: "الرياض، المملكة العربية السعودية",
};

/** أرقام التواصل المعتمدة من ملف تعريف الشركة */
export const phones = [
  { display: "+966 54 704 7635", tel: "+966547047635", wa: "966547047635" },
  { display: "+966 53 534 0744", tel: "+966535340744", wa: "966535340744" },
] as const;

export const nav = [
  { href: "/", label: "الرئيسية" },
  { href: "/services", label: "الخدمات" },
  { href: "/portfolio", label: "أعمالنا" },
  { href: "/insights", label: "رؤى وأفكار" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل" },
];

export const stats = [
  { value: 320, suffix: "+", label: "فعالية منفذة" },
  { value: 2.4, suffix: "M", label: "زائر تمت إدارتهم", decimals: 1 },
  { value: 4800, suffix: "+", label: "كادر ميداني مؤهل" },
  { value: 13, suffix: "", label: "منطقة إدارية غطيناها" },
];

/** منهجية رحلة الأثر — تُستخدم في الصفحة الرئيسية ومتتبع المراحل */
export const journey = [
  { key: "planning", title: "التخطيط", text: "نفهم أهدافك وجمهورك، ونحوّلها إلى مفهوم وخطة تشغيلية وميزانية واضحة." },
  { key: "design", title: "التصميم", text: "هوية بصرية، تصميم مساحات ثلاثي الأبعاد، وتجارب تفاعلية مصممة لجمهورك." },
  { key: "execution", title: "التنفيذ", text: "إنتاج وتركيب، كوادر ميدانية، إدارة حشود ونقل، وغرفة عمليات تعمل لحظيًا." },
  { key: "delivery", title: "التسليم", text: "تقارير أداء، توثيق إعلامي، وقياس أثر الفعالية مقابل مؤشراتك." },
];

export const sectors = [
  "جهات حكومية",
  "شركات كبرى",
  "سياحة وترفيه",
  "قطاع صحي",
  "تقنية واتصالات",
  "طاقة وصناعة",
] as const;

export type Sector = (typeof sectors)[number];
