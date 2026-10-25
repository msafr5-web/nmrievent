import type { Db, Milestone } from "./types";

const ms = (current: number): Milestone[] =>
  (["planning", "design", "execution", "delivery"] as const).map((key, i) => ({
    key,
    status: i < current ? "done" : i === current ? "current" : "upcoming",
  }));

/** بيانات البداية مأخوذة من دليل التنفيذ (الموظفان والمشروعان التجريبيان) */
export function seed(): Db {
  const now = new Date().toISOString();
  return {
    staff: [
      { id: "stf_sultan", name: "سلطان بن فهد الشمري", phone: "0501234567", education: "بكالوريوس", email: "sultan@example.com", verifiedAt: now, createdAt: now },
      { id: "stf_nora", name: "نورا بنت خالد الدوسري", phone: "0559876543", education: "دبلوم", email: "nora@example.com", verifiedAt: now, createdAt: now },
    ],
    projects: [
      {
        id: "prj_cityscape",
        name: "مؤتمر سيتي سكيب الرياض",
        date: "2026-11-15",
        location: "مركز الرياض للمعارض",
        area: "12,000 م²",
        services: "تنظيم، استقبال، إدارة حشود",
        duration: "4 أيام",
        entity: "شركة الإسكان الدولية",
        supervisor: "م. راشد السبيعي",
        status: "قيد التشغيل",
        geo: { lat: 24.7546, lng: 46.6297, radiusM: 400 },
        reference: "NMR-26-DEMO1",
        clientEmail: "client@example.com",
        milestones: [
          { key: "planning", status: "done", date: "2026-09-20", note: "اعتماد الخطة التشغيلية والميزانية" },
          { key: "design", status: "done", date: "2026-10-12", note: "اعتماد الهوية ومخططات الأجنحة" },
          { key: "execution", status: "current", date: "2026-11-15", note: "التركيب والتجهيز في الموقع" },
          { key: "delivery", status: "upcoming", date: "2026-11-25" },
        ],
        approvals: [
          { id: "apr_contract", title: "عقد تنفيذ الفعالية", kind: "عقد", status: "approved", signedBy: "شركة الإسكان الدولية", signedAt: "2026-09-25T10:00:00.000Z" },
          { id: "apr_design", title: "مخططات الأجنحة والمسرح النهائية", kind: "تصميم", status: "pending" },
          { id: "apr_budget", title: "ملحق ميزانية الضيافة الإضافية", kind: "ميزانية", status: "pending" },
        ],
        reports: [
          { id: "rep_1", title: "تقرير خطة التشغيل والموقع", date: "2026-09-28", kind: "تقرير تشغيلي" },
          { id: "rep_2", title: "صور وتوثيق مرحلة التركيب", date: "2026-11-10", kind: "توثيق إعلامي" },
        ],
        assignments: [
          { staffId: "stf_sultan", role: "منظم حشود", shiftStart: "2026-11-15T07:00:00.000Z", shiftEnd: "2026-11-15T15:00:00.000Z" },
          { staffId: "stf_nora", role: "استقبال", shiftStart: "2026-11-15T07:00:00.000Z", shiftEnd: "2026-11-15T15:00:00.000Z" },
        ],
        zones: [
          { name: "البوابة الرئيسية", capacity: 3000, current: 1840 },
          { name: "قاعة المعارض", capacity: 8000, current: 5120 },
          { name: "قاعة المؤتمرات", capacity: 1500, current: 1210 },
        ],
        parking: { capacity: 2500, occupied: 1730 },
        createdAt: now,
      },
      {
        id: "prj_lights",
        name: "مهرجان الأضواء والتقنية",
        date: "2026-12-01",
        location: "حي الطريف - الدرعية",
        area: "8,000 م²",
        services: "هولوجرام، إرشاد الزوار، ضيافة",
        duration: "7 أيام",
        entity: "هيئة تطوير بوابة الدرعية",
        supervisor: "أ. سارة التميمي",
        status: "دراسة وتحديد المتطلبات",
        geo: { lat: 24.7336, lng: 46.5725, radiusM: 500 },
        milestones: ms(0),
        approvals: [{ id: "apr_l1", title: "عرض السعر والنطاق المبدئي", kind: "ميزانية", status: "pending" }],
        reports: [],
        assignments: [],
        zones: [
          { name: "مسار الزوار", capacity: 5000, current: 0 },
          { name: "منطقة العروض الضوئية", capacity: 4000, current: 0 },
        ],
        parking: { capacity: 1800, occupied: 0 },
        createdAt: now,
      },
    ],
    leads: [
      {
        reference: "NMR-26-DEMO1",
        receivedAt: "2026-09-10T08:00:00.000Z",
        firstResponseAt: "2026-09-10T09:10:00.000Z",
        stage: "won",
        kind: "exhibition",
        tier: "premium",
        guests: 20000,
        days: 4,
        city: "riyadh",
        addOns: ["staffing", "crowd", "registration"],
        date: "2026-11-15",
        venueStatus: "booked",
        budget: "1m-5m",
        goals: "تنظيم واستقبال وإدارة حشود لمؤتمر ومعرض عقاري",
        name: "مدير الفعاليات",
        organization: "شركة الإسكان الدولية",
        email: "client@example.com",
        phone: "0500000001",
        estimate: { low: 0, high: 0, mid: 0, perGuest: 0 },
      },
    ],
    otps: [],
  };
}
