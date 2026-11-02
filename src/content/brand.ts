/**
 * الهوية البصرية لـ NMR Events — مصدر الحقيقة الوحيد.
 * مستخلصة من الشعار الرسمي (برتقالي الأسد #F05A22 وأبيض) ومن ألوان خلفيات ملف التعريف
 * (كحلي عميق، بنفسجي كهربائي، رملي). تُنسخ قيم RGB إلى globals.css ويتحقق اختبار من تطابقها.
 */

export type Theme = "dark" | "light";

/** رموز الواجهة (UI tokens) لكل وضع — تقابل متغيرات CSS في globals.css */
export const tokens: Record<Theme, Record<string, string>> = {
  dark: {
    bg: "#070B3F",
    surface: "#0C1252",
    elevated: "#141C66",
    fg: "#F4F5FF",
    muted: "#A8AFE0",
    line: "#2B3586",
    brand: "#F05A22",
    "brand-hover": "#FF7A47",
    violet: "#6502EA",
    sand: "#F6BC80",
    danger: "#FF8A80",
  },
  light: {
    bg: "#F5F6FC",
    surface: "#FFFFFF",
    elevated: "#ECEEF9",
    fg: "#070B3F",
    muted: "#4B5285",
    line: "#D3D8EE",
    brand: "#C73E12",
    "brand-hover": "#A93210",
    violet: "#5A0FD0",
    sand: "#9A5A12",
    danger: "#B42318",
  },
};

export type Swatch = {
  name: string;
  nameAr: string;
  hex: string;
  role: string;
  usage: string;
  /** لون النص المناسب فوق العينة */
  on: string;
};

/** لوحة الألوان الأساسية للعلامة (تُستخدم في المطبوعات والمواد الإعلانية والواجهة) */
export const palette: { primary: Swatch[]; supporting: Swatch[]; neutrals: Swatch[] } = {
  primary: [
    { name: "NMR Orange", nameAr: "برتقالي النمر", hex: "#F05A22", role: "اللون الرئيسي", usage: "الأسد وحرف M في الشعار، الأزرار الرئيسية، الروابط والأرقام المهمة. لا يتجاوز 10–15% من أي تصميم.", on: "#070B3F" },
    { name: "Midnight Navy", nameAr: "كحلي منتصف الليل", hex: "#070B3F", role: "خلفية العلامة", usage: "الخلفية الأساسية للمواد الداكنة والشرائح والغلاف، ولون النص على الخلفيات الفاتحة.", on: "#FFFFFF" },
    { name: "White", nameAr: "أبيض", hex: "#FFFFFF", role: "حروف الشعار والنص", usage: "حروف NMR والنص الأساسي فوق الكحلي.", on: "#070B3F" },
  ],
  supporting: [
    { name: "Royal Indigo", nameAr: "نيلي ملكي", hex: "#141C66", role: "طبقات وبطاقات", usage: "البطاقات والأسطح المرتفعة فوق الكحلي، وتدرجات الخلفيات.", on: "#FFFFFF" },
    { name: "Electric Violet", nameAr: "بنفسجي كهربائي", hex: "#6502EA", role: "إضاءة وتدرجات", usage: "التوهجات والتدرجات والخلفيات الإبداعية. للزينة فقط وليس للنصوص الصغيرة.", on: "#FFFFFF" },
    { name: "Desert Sand", nameAr: "رمل الصحراء", hex: "#F6BC80", role: "لمسة دافئة", usage: "الكلمة المميزة في العناوين (مثل Extraordinary) وخطوط الفصل الدقيقة.", on: "#070B3F" },
  ],
  neutrals: [
    { name: "Ice", nameAr: "ثلجي", hex: "#F5F6FC", role: "خلفية فاتحة", usage: "خلفية الصفحات في الوضع الفاتح.", on: "#070B3F" },
    { name: "Mist", nameAr: "ضباب", hex: "#A8AFE0", role: "نص ثانوي", usage: "النصوص الثانوية والشروحات فوق الكحلي.", on: "#070B3F" },
    { name: "Slate Indigo", nameAr: "نيلي رمادي", hex: "#4B5285", role: "نص ثانوي (فاتح)", usage: "النصوص الثانوية فوق الخلفيات الفاتحة.", on: "#FFFFFF" },
  ],
};

export const gradients = [
  { name: "Stage Glow", nameAr: "توهج المسرح", css: "radial-gradient(ellipse at 80% 20%, #6502EA 0%, transparent 55%), radial-gradient(ellipse at 10% 100%, #F05A22 0%, transparent 50%), #070B3F", use: "الأغلفة والشرائح وخلفية الصفحة الرئيسية." },
  { name: "Brand Sweep", nameAr: "انسياب العلامة", css: "linear-gradient(135deg, #F05A22 0%, #F6BC80 100%)", use: "العناوين المميزة والأزرار الخاصة وشرائط التقدم." },
  { name: "Night Fade", nameAr: "تلاشي الليل", css: "linear-gradient(180deg, #070B3F 0%, #141C66 100%)", use: "خلفيات الأقسام والبطاقات الكبيرة." },
] as const;

export const typography = {
  display: { family: "Cairo", weights: "600 · 700 · 800", use: "العناوين والأرقام الكبيرة (عربي ولاتيني بنفس الأسلوب الهندسي)." },
  body: { family: "IBM Plex Sans Arabic", weights: "300 · 400 · 500 · 600 · 700", use: "النصوص الطويلة والواجهات؛ واضح ومريح للقراءة على الشاشات." },
  scale: [
    { name: "عنوان رئيسي", cls: "text-5xl font-bold", sample: "نصنع فعاليات استثنائية" },
    { name: "عنوان قسم", cls: "text-3xl font-bold", sample: "خدماتنا المتكاملة" },
    { name: "عنوان فرعي", cls: "text-xl font-semibold", sample: "تصميم وتنفيذ الأجنحة والمعارض" },
    { name: "نص أساسي", cls: "text-base", sample: "شركة متخصصة في إدارة وتنظيم الفعاليات والمعارض وتقديم حلول متكاملة للعلامات التجارية." },
    { name: "نص صغير", cls: "text-sm text-muted", sample: "من الفكرة إلى التسليم، باحترافية عالية." },
  ],
} as const;

export const logoRules = {
  /** مساحة الأمان = ارتفاع حرف M في الشعار (x) من كل الجهات */
  clearSpace: "ارتفاع حرف M (x) من كل جانب",
  minWidthPx: 96,
  minWidthMm: 25,
  dos: [
    "استخدم النسخة الملوّنة فوق الكحلي والألوان الداكنة، ونسخة الحروف الكحلية فوق الأبيض والألوان الفاتحة.",
    "اترك مساحة الأمان حول الشعار دون أي عنصر.",
    "استخدم النسخة أحادية اللون (أبيض أو كحلي) فوق الصور المزدحمة أو في الطباعة بلون واحد.",
  ],
  donts: [
    "لا تمدّ الشعار أو تضغطه أو تدوّره.",
    "لا تغيّر ألوان الأسد أو الحروف خارج النسخ المعتمدة.",
    "لا تضع الشعار الملوّن فوق خلفية برتقالية أو بنفسجية فاتحة تُخفي التباين.",
    "لا تضف ظلالًا أو إطارات أو توهجًا للشعار.",
  ],
} as const;

/** ملفات حزمة الشعار (public/images/brand) */
export const logoFiles = [
  { file: "nmr-logo.png", label: "الشعار الملوّن — للخلفيات الداكنة", bg: "#070B3F" },
  { file: "nmr-logo-on-light.png", label: "الشعار الملوّن — للخلفيات الفاتحة", bg: "#FFFFFF" },
  { file: "nmr-logo-white.png", label: "أحادي اللون — أبيض", bg: "#141C66" },
  { file: "nmr-logo-navy.png", label: "أحادي اللون — كحلي", bg: "#F5F6FC" },
  { file: "nmr-mark.png", label: "الرمز فقط (الأسد وNMR)", bg: "#070B3F" },
] as const;
