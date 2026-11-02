/**
 * اختبار تكامل على PostgreSQL حقيقي (خادم مؤقت عبر embedded-postgres) — يشغَّل بـ `npm run test:db`.
 * يطبّق ملف الـ migration الفعلي ويختبر المستودع عبر مشغّل `pg` نفسه.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryError } from "@/lib/rfq-delivery";
import { createPgLeadRepository } from "./pg-lead-repository";
import { MAX_DELIVERY_ATTEMPTS, retryPending, submitLead } from "./submit-lead";

const PORT = 54_330 + Math.floor(Math.random() * 500);
const dir = mkdtempSync(join(tmpdir(), "nmr-pg-"));
const server = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "pw", port: PORT, persistent: false, initdbFlags: ["--encoding=UTF8", "--locale=C"] });

let pool: Pool;
const repo = () => createPgLeadRepository(pool);
const lead = (reference: string) => ({ reference, receivedAt: "2026-11-02T00:00:00Z", organization: "شركة", estimate: { low: 1, high: 2 } });
const webhook = { url: "https://hook.test", timeoutMs: 1000 };
const row = async (ref: string) => (await pool.query("SELECT * FROM rfq_leads WHERE reference = $1", [ref])).rows[0];
const rewind = (ref: string) => pool.query("UPDATE rfq_leads SET next_attempt_at = now() - interval '1 second' WHERE reference = $1", [ref]);

beforeAll(async () => {
  await server.initialise();
  await server.start();
  await server.createDatabase("nmr");
  pool = new Pool({ connectionString: `postgres://postgres:pw@localhost:${PORT}/nmr`, max: 8 });
  const sql = readFileSync(join(__dirname, "../../../db/migrations/001_rfq_leads.sql"), "utf8");
  await pool.query(sql);
  await pool.query(sql); // idempotent: IF NOT EXISTS
}, 120_000);

afterAll(async () => {
  await pool?.end();
  await server.stop();
  rmSync(dir, { recursive: true, force: true });
}, 60_000);

beforeEach(async () => {
  await pool.query("TRUNCATE rfq_leads");
});

describe("rfq_leads على PostgreSQL حقيقي", () => {
  it("create: يحفظ JSONB كاملًا بالعربية ويرفض التكرار دون خطأ", async () => {
    expect(await repo().create(lead("A1"), "pending")).toBe(true);
    expect(await repo().create(lead("A1"), "pending")).toBe(false);
    const r = await row("A1");
    expect(r.payload).toEqual(lead("A1"));
    expect(r.status).toBe("pending");
    expect(r.attempts).toBe(0);
  });

  it("يرفض حالة غير مسموحة (CHECK constraint)", async () => {
    await expect(pool.query("INSERT INTO rfq_leads (reference, payload, status) VALUES ('X', '{}', 'bogus')")).rejects.toThrow();
  });

  it("markFailed: يزيد المحاولات ويؤجّل الموعد أسّيًا ثم يصير failed", async () => {
    await repo().create(lead("B1"), "pending");
    await repo().markFailed("B1", "boom", 3);
    let r = await row("B1");
    expect(r).toMatchObject({ attempts: 1, status: "pending", last_error: "boom" });
    expect(r.next_attempt_at.getTime()).toBeGreaterThan(Date.now() + 30_000); // ~1 دقيقة
    await repo().markFailed("B1", "boom", 3);
    await repo().markFailed("B1", "x".repeat(900), 3);
    r = await row("B1");
    expect(r).toMatchObject({ attempts: 3, status: "failed" });
    expect(r.last_error).toHaveLength(500);
  });

  it("markDelivered ثم markFailed لا يُرجع الطلب المُسلَّم", async () => {
    await repo().create(lead("C1"), "pending");
    await repo().markDelivered("C1");
    await repo().markFailed("C1", "late", 8);
    const r = await row("C1");
    expect(r).toMatchObject({ status: "delivered", attempts: 0 });
    expect(r.delivered_at).toBeInstanceOf(Date);
  });

  it("claimPending: يحجز المستحق فقط، ولا يعيد حجز نفس الصف قبل انتهاء المهلة", async () => {
    await repo().create(lead("D1"), "pending");
    await repo().create(lead("D2"), "stored"); // غير معلّق
    await repo().create(lead("D3"), "pending");
    await pool.query("UPDATE rfq_leads SET next_attempt_at = now() + interval '1 hour' WHERE reference = 'D3'");

    const first = await repo().claimPending(10, 8);
    expect(first.map((c) => c.reference)).toEqual(["D1"]);
    expect(first[0].payload).toEqual(lead("D1"));
    expect(await repo().claimPending(10, 8)).toEqual([]);
  });

  it("claimPending: عمّال متزامنون لا يحجزون الصف ذاته مرتين", async () => {
    for (let i = 0; i < 20; i++) await repo().create(lead(`E${i}`), "pending");
    const batches = await Promise.all(Array.from({ length: 6 }, () => repo().claimPending(5, 8)));
    const refs = batches.flat().map((c) => c.reference);
    expect(refs).toHaveLength(20);
    expect(new Set(refs).size).toBe(20);
  });

  it("claimPending: يتجاهل ما استنفد محاولاته", async () => {
    await repo().create(lead("F1"), "pending");
    await pool.query("UPDATE rfq_leads SET attempts = 8 WHERE reference = 'F1'");
    expect(await repo().claimPending(10, 8)).toEqual([]);
  });
});

describe("purgeOlderThan على PostgreSQL حقيقي", () => {
  const age = (ref: string, days: number) =>
    pool.query("UPDATE rfq_leads SET created_at = now() - make_interval(days => $2::int) WHERE reference = $1", [ref, days]);

  it("يحذف delivered/stored/failed الأقدم من المدة فقط، ولا يمس pending ولا الحديث", async () => {
    for (const [ref, st] of [["P1", "pending"], ["P2", "pending"], ["P3", "stored"], ["P4", "pending"], ["P5", "pending"]] as const) {
      await repo().create(lead(ref), st);
    }
    await repo().markDelivered("P2");
    await pool.query("UPDATE rfq_leads SET status = 'failed' WHERE reference = 'P4'");
    for (const ref of ["P1", "P2", "P3", "P4"]) await age(ref, 200); // P5 حديث
    expect(await repo().purgeOlderThan(180)).toBe(3); // P2 (delivered) + P3 (stored) + P4 (failed)
    const left = (await pool.query("SELECT reference FROM rfq_leads ORDER BY reference")).rows.map((r) => r.reference);
    expect(left).toEqual(["P1", "P5"]); // P1 معلّق قديم يبقى
    expect(await repo().purgeOlderThan(180)).toBe(0);
  });
});

describe("submitLead + retryPending على PostgreSQL حقيقي", () => {
  it("فشل الـ Webhook → pending، ثم cron يسلّمه ويصير delivered", async () => {
    const down = vi.fn().mockRejectedValue(new DeliveryError("down", 503));
    expect(await submitLead(lead("G1"), { repo: repo(), webhook, deliver: down })).toBe("queued");
    expect(await row("G1")).toMatchObject({ status: "pending", attempts: 1 });

    expect(await retryPending(repo(), webhook, { deliver: vi.fn() })).toMatchObject({ claimed: 0 }); // لم يحن الموعد
    await rewind("G1");
    const up = vi.fn().mockResolvedValue(undefined);
    expect(await retryPending(repo(), webhook, { deliver: up })).toEqual({ claimed: 1, delivered: 1, failed: 0 });
    expect(up.mock.calls[0][0]).toEqual(lead("G1")); // الـ payload المخزَّن هو المُرسَل
    expect(await row("G1")).toMatchObject({ status: "delivered" });
  });

  it("استمرار الفشل حتى failed بعد MAX_DELIVERY_ATTEMPTS", async () => {
    const down = vi.fn().mockRejectedValue(new DeliveryError("down", 503));
    await submitLead(lead("H1"), { repo: repo(), webhook, deliver: down });
    for (let i = 1; i < MAX_DELIVERY_ATTEMPTS; i++) {
      await rewind("H1");
      await retryPending(repo(), webhook, { deliver: down });
    }
    expect(await row("H1")).toMatchObject({ status: "failed", attempts: MAX_DELIVERY_ATTEMPTS });
  });

  it("بدون webhook يُحفظ كـ stored ولا يدخل طابور الإعادة", async () => {
    expect(await submitLead(lead("I1"), { repo: repo(), webhook: null })).toBe("stored");
    await rewind("I1");
    expect(await retryPending(repo(), webhook, { deliver: vi.fn() })).toMatchObject({ claimed: 0 });
  });
});
