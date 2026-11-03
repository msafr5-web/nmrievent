import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const parseDotenv = (text: string) =>
  Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );

describe("إعدادات النشر", () => {
  const example = parseDotenv(readFileSync(join(process.cwd(), "deploy", ".env.production.example"), "utf8"));

  it("مثال ملف الأسرار يجتاز مخطط البيئة الفعلي", () => {
    const env = parseServerEnv({ ...example, NODE_ENV: "production" });
    expect(env.DATABASE_URL).toContain("@db:5432/nmr");
    expect(env.CRON_SECRET).toBeDefined();
    expect(env.RFQ_RETENTION_DAYS).toBe(180);
  });

  it("كلمة سر القاعدة داخل DATABASE_URL هي نفسها POSTGRES_PASSWORD", () => {
    expect(new URL(example.DATABASE_URL).password).toBe(example.POSTGRES_PASSWORD);
  });

  it("Caddy يخدم النطاق ويحوّل www إليه", () => {
    const caddy = readFileSync(join(process.cwd(), "deploy", "Caddyfile"), "utf8");
    expect(caddy).toMatch(/\{\$SITE_ADDRESS::80\}/);
    expect(caddy).toMatch(/redir https:\/\/\{\$SITE_ADDRESS:localhost\}\{uri\} permanent/);
    expect(example.SITE_ADDRESS).toBe("nmrevent.com");
    expect(example.WWW_ADDRESS).toBe(`www.${example.SITE_ADDRESS}`);
  });

  it("compose يشترط الأسرار ولا ينشر منفذ القاعدة", () => {
    const compose = readFileSync(join(process.cwd(), "deploy", "docker-compose.yml"), "utf8");
    expect(compose).toMatch(/CRON_SECRET: \$\{CRON_SECRET:\?/);
    expect(compose).toMatch(/POSTGRES_PASSWORD: \$\{POSTGRES_PASSWORD:\?/);
    const db = compose.slice(compose.indexOf("  db:"), compose.indexOf("  migrate:"));
    expect(db).not.toMatch(/ports:/);
  });
});
