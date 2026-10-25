import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { estimate } from "@/lib/estimator";
import { seed } from "./seed";
import type { Db } from "./types";

/**
 * مخزن بيانات بملف JSON لمرحلة النموذج الأولي.
 * الواجهة (read / mutate) مصممة لتُستبدل بـ PostgreSQL (انظر docs/schema.sql) دون تغيير الصفحات.
 */
// Serverless hosts such as Vercel only allow writes under /tmp (ephemeral).
const DATA_DIR =
  process.env.DATA_DIR ??
  (process.env.VERCEL ? path.join("/tmp", "nmrievent-data") : path.join(process.cwd(), ".data"));
const FILE = path.join(DATA_DIR, "db.json");

let cache: Db | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
  } catch {
    cache = seed();
    for (const l of cache.leads) l.estimate = estimate(l);
    await persist(cache);
  }
  return cache;
}

async function persist(db: Db) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, FILE);
  } catch (err) {
    // بيئات القراءة فقط (مثل الاستضافة بلا خادم) تعمل من الذاكرة
    console.warn("[db] persist skipped:", (err as Error).message);
  }
}

export async function read(): Promise<Db> {
  return structuredClone(await load());
}

/** تعديل متسلسل لتفادي تعارض الكتابة المتزامنة */
export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
