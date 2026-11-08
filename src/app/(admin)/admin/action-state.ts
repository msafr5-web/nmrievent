/** حالة نتيجة إجراء الخادم لنماذج لوحة التحكم (تُستهلك بـ useActionState) */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** رابط للنسخ (مثل رابط الدعوة) */
  link?: string;
};
