import type { Estimate } from "@/lib/estimator";
import type { RfqInput } from "@/lib/rfq";

export type Education = "الثانوية العامة" | "دبلوم" | "بكالوريوس" | "دراسات عليا";
export const educationLevels: Education[] = ["الثانوية العامة", "دبلوم", "بكالوريوس", "دراسات عليا"];

export type Staff = {
  id: string;
  name: string;
  phone: string;
  education: Education;
  email: string;
  verifiedAt: string;
  createdAt: string;
};

export type ProjectStatus = "دراسة وتحديد المتطلبات" | "قيد التشغيل" | "مكتمل";
export const projectStatuses: ProjectStatus[] = ["دراسة وتحديد المتطلبات", "قيد التشغيل", "مكتمل"];

export type MilestoneKey = "planning" | "design" | "execution" | "delivery";
export type Milestone = { key: MilestoneKey; status: "done" | "current" | "upcoming"; date?: string; note?: string };

export type Approval = {
  id: string;
  title: string;
  kind: "عقد" | "تصميم" | "ميزانية";
  status: "pending" | "approved";
  signedBy?: string;
  signedAt?: string;
  /** صورة التوقيع الرقمي (PNG data URL) */
  signature?: string;
};

export type Report = { id: string; title: string; date: string; kind: "تقرير تشغيلي" | "توثيق إعلامي" | "تقرير أداء" };

export type Assignment = {
  staffId: string;
  role: string;
  shiftStart: string; // ISO
  shiftEnd: string; // ISO
  checkIn?: { at: string; distanceM: number; method: "geo" | "manual" };
  checkOut?: { at: string };
  notifiedAt?: string;
};

export type Zone = { name: string; capacity: number; current: number };

export type Project = {
  id: string;
  name: string;
  date: string;
  location: string;
  area: string;
  services: string;
  duration: string;
  entity: string;
  supervisor: string;
  status: ProjectStatus;
  /** إحداثيات موقع الفعالية لنطاق التحضير الجغرافي */
  geo: { lat: number; lng: number; radiusM: number };
  /** ربط المشروع بطلب العرض وبريد العميل لبوابة العملاء */
  reference?: string;
  clientEmail?: string;
  milestones: Milestone[];
  approvals: Approval[];
  reports: Report[];
  assignments: Assignment[];
  zones: Zone[];
  parking: { capacity: number; occupied: number };
  createdAt: string;
};

export type LeadStage = "new" | "qualified" | "proposal" | "won" | "lost";
export const leadStages: { id: LeadStage; label: string }[] = [
  { id: "new", label: "طلب جديد" },
  { id: "qualified", label: "مؤهل" },
  { id: "proposal", label: "عرض مُرسل" },
  { id: "won", label: "تم التعاقد" },
  { id: "lost", label: "لم يتم" },
];

export type Lead = Omit<RfqInput, "consent" | "company_site"> & {
  reference: string;
  receivedAt: string;
  stage: LeadStage;
  estimate: Estimate;
  firstResponseAt?: string;
};

export type OtpEntry = {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  payload: Pick<Staff, "name" | "phone" | "education" | "email">;
};

export type Db = { staff: Staff[]; projects: Project[]; leads: Lead[]; otps: OtpEntry[] };
