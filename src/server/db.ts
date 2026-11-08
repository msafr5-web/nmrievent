import { Pool } from "pg";

export type Db = Pick<Pool, "query">;

const g = globalThis as unknown as { __nmrPool?: Pool };

/** Pool مشترك لكل الخدمات (يتفادى استنزاف الاتصالات مع HMR/serverless). null إن لم تُضبط DATABASE_URL. */
export function getPool(url: string | undefined = process.env.DATABASE_URL): Pool | null {
  if (!url) return null;
  g.__nmrPool ??= new Pool({ connectionString: url, max: 8, connectionTimeoutMillis: 3_000, idleTimeoutMillis: 10_000 });
  return g.__nmrPool;
}
