import type { Sector } from "./site";

export type EventType = "مؤتمر" | "معرض" | "حفل تدشين" | "تفعيل تجاري" | "مهرجان";

export type Project = {
  slug: string;
  title: string;
  client: string;
  sector: Sector;
  type: EventType;
  city: string;
  year: number;
  attendees: string;
  summary: string;
  challenge: string;
  solution: string;
  results: { value: string; label: string }[];
  services: string[];
  /** لونان لتوليد غلاف بصري إلى أن تُستبدل بصور حقيقية من نظام إدارة المحتوى */
  palette: [string, string];
};

export const eventTypes: EventType[] = ["مؤتمر", "معرض", "حفل تدشين", "تفعيل تجاري", "مهرجان"];

// محتوى توضيحي — يُستبدل بأعمال حقيقية عبر Sanity/Strapi
export const projects: Project[] = [
  {
    slug: "future-health-summit",
    title: "قمة مستقبل الصحة",
    client: "جهة صحية حكومية",
    sector: "قطاع صحي",
    type: "مؤتمر",
    city: "الرياض",
    year: 2026,
    attendees: "6,500",
    summary: "مؤتمر دولي لثلاثة أيام بمشاركة 140 متحدثًا ومعرض مصاحب.",
    challenge: "إدارة تسجيل آلاف الحضور من 40 دولة مع جلسات متوازية وبروتوكول كبار الشخصيات.",
    solution: "منصة تسجيل ذكية ببطاقات NFC، تطبيق أجندة تفاعلي، وفريق بروتوكول من 120 كادرًا.",
    results: [{ value: "98%", label: "رضا الحضور" }, { value: "12 ث", label: "متوسط زمن الدخول" }, { value: "140", label: "متحدثًا" }],
    services: ["tech", "staffing", "creative"],
    palette: ["#1F5C4A", "#CEA85E"],
  },
  {
    slug: "desert-lights-festival",
    title: "مهرجان أضواء الصحراء",
    client: "جهة سياحية",
    sector: "سياحة وترفيه",
    type: "مهرجان",
    city: "العلا",
    year: 2025,
    attendees: "180,000",
    summary: "مهرجان مفتوح لعشرين ليلة يمزج الفن الضوئي بالتراث.",
    challenge: "تدفق حشود كبير في موقع مفتوح بعيد عن المدن مع بنية تحتية محدودة.",
    solution: "نمذجة تدفق الحشود، نقل ترددي من مواقف ذكية، وغرفة عمليات بكاميرات تحليلية.",
    results: [{ value: "180K", label: "زائر" }, { value: "0", label: "حوادث جسيمة" }, { value: "-35%", label: "زمن الانتظار" }],
    services: ["crowd", "logistics", "creative"],
    palette: ["#A65234", "#E8CF96"],
  },
  {
    slug: "smart-city-expo",
    title: "معرض المدن الذكية",
    client: "شركة تقنية كبرى",
    sector: "تقنية واتصالات",
    type: "معرض",
    city: "جدة",
    year: 2026,
    attendees: "22,000",
    summary: "جناح رئيسي بمساحة 1,200 م² بتجارب هولوجرام وواقع معزز.",
    challenge: "إبراز حلول تقنية معقدة لجمهور متنوع خلال زيارة لا تتجاوز دقائق.",
    solution: "مسار تجربة قصصي من خمس محطات، هولوجرام للمتحدث الرئيسي، وتسجيل عملاء محتملين بـ QR.",
    results: [{ value: "4,300", label: "عميل محتمل" }, { value: "7 د", label: "متوسط مدة الزيارة" }, { value: "#1", label: "أفضل جناح" }],
    services: ["tech", "creative"],
    palette: ["#0E2A47", "#6FB7C9"],
  },
  {
    slug: "national-energy-launch",
    title: "تدشين مشروع طاقة وطني",
    client: "شركة طاقة",
    sector: "طاقة وصناعة",
    type: "حفل تدشين",
    city: "الدمام",
    year: 2025,
    attendees: "900",
    summary: "حفل تدشين برعاية رسمية مع عرض بصري على واجهة بطول 80 مترًا.",
    challenge: "جدول زمني ضيق لثلاثة أسابيع وبروتوكول رعاية رسمية دقيق.",
    solution: "فريق إنتاج متوازي، عرض إسقاط ضوئي، وغرفة تنسيق بروتوكول موحدة.",
    results: [{ value: "21 يومًا", label: "من الفكرة للتنفيذ" }, { value: "80 م", label: "إسقاط ضوئي" }, { value: "100%", label: "التزام بالجدول" }],
    services: ["creative", "staffing", "logistics"],
    palette: ["#2B2B2B", "#CEA85E"],
  },
  {
    slug: "brand-roadshow",
    title: "جولة تفعيل علامة تجارية",
    client: "علامة استهلاكية",
    sector: "شركات كبرى",
    type: "تفعيل تجاري",
    city: "الرياض، جدة، الخبر",
    year: 2026,
    attendees: "60,000",
    summary: "جولة تفعيل في ثلاث مدن خلال موسم الرياض بمنصات تفاعلية متنقلة.",
    challenge: "تجربة موحدة في ثلاث مدن مع فرق ميدانية مختلفة وقياس لحظي للأداء.",
    solution: "منصة متنقلة قابلة للتركيب خلال 6 ساعات، وجدولة كوادر مركزية مع لوحة مؤشرات.",
    results: [{ value: "60K", label: "تفاعل مباشر" }, { value: "3", label: "مدن" }, { value: "+28%", label: "مبيعات الفترة" }],
    services: ["creative", "staffing", "tech"],
    palette: ["#5B2A86", "#F2B66D"],
  },
  {
    slug: "gov-digital-forum",
    title: "منتدى التحول الرقمي الحكومي",
    client: "جهة حكومية",
    sector: "جهات حكومية",
    type: "مؤتمر",
    city: "الرياض",
    year: 2024,
    attendees: "3,200",
    summary: "منتدى هجين بحضور مباشر وبث لأكثر من 25 ألف مشاهد.",
    challenge: "تجربة متكافئة للحضور الحضوري والافتراضي مع متطلبات أمن معلومات عالية.",
    solution: "استوديو بث متكامل، منصة افتراضية مستضافة محليًا، وتسجيل آمن متوافق مع PDPL.",
    results: [{ value: "25K", label: "مشاهد عن بعد" }, { value: "99.9%", label: "استقرار البث" }, { value: "PDPL", label: "امتثال كامل" }],
    services: ["tech", "logistics", "staffing"],
    palette: ["#1F5C4A", "#9FD3BE"],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
