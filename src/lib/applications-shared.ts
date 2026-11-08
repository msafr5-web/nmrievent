/** ثوابت وتسميات طلبات التقديم — مشتركة بين الواجهة والخادم (بدون zod حتى لا يُحمَّل في المتصفح) */

/** مدد الاحتفاظ الافتراضية بالأيام (تُضبط بمتغيرات البيئة RFQ_RETENTION_DAYS / APPLICATION_RETENTION_DAYS) */
export const RETENTION_DEFAULTS = { rfq: 180, rejectedApplications: 365 } as const;

/** إصدار سياسة الخصوصية التي وافق عليها المتقدم؛ يُحدَّث عند أي تعديل جوهري على السياسة */
export const POLICY_VERSION = "2026-11";

export type ApplicationKind = "staff" | "exhibition";
export const APPLICATION_KINDS: readonly ApplicationKind[] = ["staff", "exhibition"];

export const APPLICATION_STATUSES = ["new", "under_review", "needs_info", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const statusLabels: Record<ApplicationStatus, string> = {
  new: "جديد",
  under_review: "قيد المراجعة",
  needs_info: "بانتظار استكمال البيانات",
  approved: "مقبول",
  rejected: "غير مقبول",
};

/** وصف ما يراه المتقدم في صفحة متابعة الطلب */
export const statusPublicText: Record<ApplicationStatus, string> = {
  new: "استلمنا طلبك وسيبدأ فريقنا بمراجعته قريبًا.",
  under_review: "طلبك قيد المراجعة لدى الفريق المختص.",
  needs_info: "نحتاج منك معلومات إضافية، راجع ملاحظات الفريق أدناه وأرسل ردك.",
  approved: "تهانينا، تم قبول طلبك. سيتواصل معك فريقنا لإكمال الخطوات التالية.",
  rejected: "نشكرك على اهتمامك. للأسف لم نتمكن من قبول طلبك في الوقت الحالي.",
};

export const kindLabels: Record<ApplicationKind, string> = { staff: "طلب توظيف / انضمام للكوادر", exhibition: "طلب مشاركة في معرض" };

export const regions = [
  { id: "riyadh", label: "الرياض" },
  { id: "jeddah", label: "جدة" },
  { id: "makkah", label: "مكة المكرمة" },
  { id: "madinah", label: "المدينة المنورة" },
  { id: "eastern", label: "المنطقة الشرقية (الدمام/الخبر)" },
  { id: "taif", label: "الطائف" },
  { id: "abha", label: "أبها / عسير" },
  { id: "tabuk", label: "تبوك" },
  { id: "hail", label: "حائل" },
  { id: "qassim", label: "القصيم" },
  { id: "jazan", label: "جازان" },
  { id: "najran", label: "نجران" },
  { id: "alula", label: "العلا / المدينة" },
  { id: "other", label: "منطقة أخرى" },
] as const;
export type RegionId = (typeof regions)[number]["id"];

export const staffRoles = [
  { id: "host", label: "مضيف / مضيفة" },
  { id: "registration", label: "تسجيل واستقبال" },
  { id: "protocol", label: "بروتوكول وكبار الشخصيات" },
  { id: "organizer", label: "منظم / مشرف منطقة" },
  { id: "crowd", label: "إدارة حشود" },
  { id: "security", label: "أمن وسلامة" },
  { id: "setup", label: "فني تركيب وتجهيز" },
  { id: "tech", label: "دعم تقني وصوتيات" },
  { id: "driver", label: "نقل وسائقون" },
  { id: "photo", label: "تصوير وتوثيق" },
] as const;
export type StaffRoleId = (typeof staffRoles)[number]["id"];

export const languages = [
  { id: "ar", label: "العربية" },
  { id: "en", label: "الإنجليزية" },
  { id: "other", label: "لغة أخرى" },
] as const;

export const availabilityOptions = [
  { id: "fulltime", label: "دوام كامل" },
  { id: "parttime", label: "دوام جزئي" },
  { id: "weekends", label: "نهاية الأسبوع فقط" },
  { id: "events", label: "حسب الفعاليات" },
] as const;

export const genders = [
  { id: "male", label: "ذكر" },
  { id: "female", label: "أنثى" },
] as const;

export const nationalities = [
  { id: "saudi", label: "سعودي / سعودية" },
  { id: "resident", label: "مقيم / مقيمة" },
] as const;

export const boothTypes = [
  { id: "standard", label: "جناح جاهز (قياسي)" },
  { id: "custom", label: "تصميم وتنفيذ مخصص" },
  { id: "open", label: "مساحة مفتوحة (Open space)" },
  { id: "undecided", label: "لم أحدد بعد" },
] as const;

export const exhibitionServices = [
  { id: "design", label: "تصميم الجناح (3D)" },
  { id: "build", label: "تنفيذ وتركيب" },
  { id: "printing", label: "طباعة ولوحات" },
  { id: "staffing", label: "كوادر ومضيفون" },
  { id: "tech", label: "حلول تقنية وشاشات" },
  { id: "logistics", label: "شحن ولوجستيات" },
] as const;

export const exhibitorSectors = [
  "جهات حكومية",
  "شركات كبرى",
  "سياحة وترفيه",
  "قطاع صحي",
  "تقنية واتصالات",
  "طاقة وصناعة",
  "عقارات وإنشاءات",
  "تجزئة وأغذية",
  "تعليم",
  "أخرى",
] as const;

export const labelOf = <T extends { id: string; label: string }>(list: readonly T[], id: string) => list.find((x) => x.id === id)?.label ?? id;

/** حدود رفع السيرة الذاتية */
export const CV_MAX_BYTES = 5 * 1024 * 1024;
