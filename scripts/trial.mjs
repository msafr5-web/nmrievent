/**
 * نسخة تجريبية محلية: PostgreSQL دائم (مجلد .trial-db) + تطبيق الـ migration + `next dev`.
 * لا خدمات خارجية. الطلبات التي ترسلها من /rfq تُحفظ وتُعرض بـ `npm run trial:leads`.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dbDir = join(root, ".trial-db");
const PORT = Number(process.env.TRIAL_DB_PORT ?? 54329);
const url = `postgres://postgres:trial@localhost:${PORT}/nmr`;

const server = new EmbeddedPostgres({ databaseDir: dbDir, user: "postgres", password: "trial", port: PORT, persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"] });
if (!existsSync(join(dbDir, "PG_VERSION"))) await server.initialise();
await server.start();
try {
  await server.createDatabase("nmr");
} catch {
  /* القاعدة موجودة من تشغيل سابق */
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const migrations = join(root, "db", "migrations");
for (const f of readdirSync(migrations).filter((x) => x.endsWith(".sql")).sort()) {
  await client.query(readFileSync(join(migrations, f), "utf8"));
}
await client.end();
console.log(`\n✔ PostgreSQL التجريبي جاهز على المنفذ ${PORT} (البيانات في .trial-db)\n`);

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const app = spawn(process.execPath, [nextBin, "dev"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: url,
    CRON_SECRET: process.env.CRON_SECRET ?? "trial-cron-secret-0000",
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL ?? "msafr.5@gmail.com",
    // رمز إعداد تجريبي محلي فقط: افتح http://localhost:3000/admin/setup
    ADMIN_BOOTSTRAP_TOKEN: process.env.ADMIN_BOOTSTRAP_TOKEN ?? "trial-bootstrap-token-0123456789",
    UPLOAD_DIR: process.env.UPLOAD_DIR ?? join(root, ".trial-data"),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  },
});

let stopping = false;
const shutdown = async () => {
  if (stopping) return;
  stopping = true;
  app.kill();
  await server.stop().catch(() => {});
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
app.on("exit", shutdown);
