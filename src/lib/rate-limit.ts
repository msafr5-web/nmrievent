export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  now?: () => number;
  /** أقصى عدد مفاتيح قبل التنظيف الإجباري (يمنع تسرب الذاكرة) */
  maxKeys?: number;
};

/**
 * محدِّد معدل بنافذة ثابتة في الذاكرة.
 * ملاحظة: يعمل لكل instance فقط؛ في بيئة متعددة النسخ يُستبدل بـ Redis/Upstash خلف نفس الواجهة.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now, maxKeys = 5_000 }: RateLimiterOptions) {
  const hits = new Map<string, { count: number; reset: number }>();

  const sweep = (t: number) => {
    for (const [key, entry] of hits) if (entry.reset <= t) hits.delete(key);
  };

  return {
    /** يعيد true إذا تجاوز المفتاح الحد */
    isLimited(key: string): boolean {
      const t = now();
      if (hits.size >= maxKeys) sweep(t);
      const entry = hits.get(key);
      if (!entry || entry.reset <= t) {
        hits.set(key, { count: 1, reset: t + windowMs });
        return false;
      }
      entry.count += 1;
      return entry.count > limit;
    },
    /** هل المفتاح محظور الآن؟ (فحص بلا زيادة العدّاد) */
    peek(key: string): boolean {
      const entry = hits.get(key);
      return !!entry && entry.reset > now() && entry.count > limit;
    },
    /** يسجّل محاولة (تُستخدم لعدّ الإخفاقات فقط) */
    hit(key: string): void {
      const t = now();
      if (hits.size >= maxKeys) sweep(t);
      const entry = hits.get(key);
      if (!entry || entry.reset <= t) hits.set(key, { count: 1, reset: t + windowMs });
      else entry.count += 1;
    },
    size: () => hits.size,
  };
}
