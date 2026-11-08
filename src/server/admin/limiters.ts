import { createRateLimiter } from "@/lib/rate-limit";

/** محدّدات المعدل لمسارات لوحة التحكم والنماذج العامة (في الذاكرة لكل نسخة؛ الخادم نسخة واحدة) */
const g = globalThis as unknown as { __nmrLimiters?: Record<string, ReturnType<typeof createRateLimiter>> };
const limiters = (g.__nmrLimiters ??= {
  login: createRateLimiter({ limit: 10, windowMs: 15 * 60_000 }),
  apply: createRateLimiter({ limit: 5, windowMs: 10 * 60_000 }),
  status: createRateLimiter({ limit: 20, windowMs: 10 * 60_000 }),
  upload: createRateLimiter({ limit: 60, windowMs: 10 * 60_000 }),
});

export const limiter = limiters;
