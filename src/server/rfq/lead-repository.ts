export type Lead = { reference: string; receivedAt: string } & Record<string, unknown>;
export type LeadStatus = "stored" | "pending" | "delivered" | "failed";
export type ClaimedLead = { reference: string; payload: Lead; attempts: number };

/** واجهة تخزين الطلبات؛ التطبيقات: Postgres للإنتاج وذاكرة للتطوير والاختبار */
export interface LeadRepository {
  /** يحفظ الطلب؛ يعيد false إن كان المرجع موجودًا مسبقًا */
  create(lead: Lead, status: Extract<LeadStatus, "stored" | "pending">): Promise<boolean>;
  markDelivered(reference: string): Promise<void>;
  /** يسجل فشلًا ويجدول المحاولة التالية (backoff أسّي) أو يحوّل الحالة إلى failed عند استنفاد المحاولات */
  markFailed(reference: string, error: string, maxAttempts: number): Promise<void>;
  /** يحجز دفعة من الطلبات المعلّقة المستحقة (آمن مع عدة عمّال متزامنين) */
  claimPending(limit: number, maxAttempts: number): Promise<ClaimedLead[]>;
  /** يحذف الطلبات المنتهية (delivered/stored/failed) الأقدم من المدة؛ لا يمس pending. يعيد عدد المحذوف */
  purgeOlderThan(days: number): Promise<number>;
}
