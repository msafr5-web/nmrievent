import { describe, expect, it, vi } from "vitest";
import { DeliveryError } from "@/lib/rfq-delivery";
import { createMemoryLeadRepository } from "./memory-lead-repository";
import { createPgLeadRepository } from "./pg-lead-repository";
import { MAX_DELIVERY_ATTEMPTS, retryPending, submitLead } from "./submit-lead";

const lead = (reference: string) => ({ reference, receivedAt: "2026-11-02T00:00:00Z", organization: "x" });
const webhook = { url: "https://hook.test", timeoutMs: 1000 };
const ok = vi.fn().mockResolvedValue(undefined);
const boom = () => vi.fn().mockRejectedValue(new DeliveryError("down", 500));

describe("submitLead", () => {
  it("يحفظ ثم يسلّم ويعلّم الطلب delivered", async () => {
    const repo = createMemoryLeadRepository();
    expect(await submitLead(lead("A"), { repo, webhook, deliver: ok })).toBe("delivered");
    expect(repo.rows.get("A")?.status).toBe("delivered");
  });

  it("فشل التسليم لا يضيّع الطلب: يبقى pending ويُبلَّغ العميل بالنجاح", async () => {
    const repo = createMemoryLeadRepository();
    expect(await submitLead(lead("B"), { repo, webhook, deliver: boom() })).toBe("queued");
    expect(repo.rows.get("B")).toMatchObject({ status: "pending", attempts: 1 });
  });

  it("بدون webhook يُحفظ فقط (stored)", async () => {
    const repo = createMemoryLeadRepository();
    expect(await submitLead(lead("C"), { repo, webhook: null })).toBe("stored");
    expect(repo.rows.get("C")?.status).toBe("stored");
  });

  it("يرمي إن فشل الحفظ (لا نجاح كاذب)", async () => {
    const repo = createMemoryLeadRepository();
    repo.create = vi.fn().mockRejectedValue(new Error("db down"));
    await expect(submitLead(lead("D"), { repo, webhook, deliver: ok })).rejects.toThrow("db down");
  });

  it("بدون مستودع: تسليم متزامن ويرمي عند الفشل", async () => {
    expect(await submitLead(lead("E"), { repo: null, webhook, deliver: ok })).toBe("delivered");
    await expect(submitLead(lead("E"), { repo: null, webhook, deliver: boom() })).rejects.toBeInstanceOf(DeliveryError);
    await expect(submitLead(lead("E"), { repo: null, webhook: null })).rejects.toThrow();
  });
});

describe("retryPending", () => {
  it("يعيد تسليم المعلّق بعد انقضاء مهلة backoff ولا يكرر المُسلَّم", async () => {
    let t = 0;
    const repo = createMemoryLeadRepository(() => t);
    await submitLead(lead("F"), { repo, webhook, deliver: boom() });
    await submitLead(lead("G"), { repo, webhook, deliver: ok });

    expect(await retryPending(repo, webhook, { deliver: ok })).toMatchObject({ claimed: 0 }); // لم يحن موعده
    t = 61_000;
    const deliver = vi.fn().mockResolvedValue(undefined);
    expect(await retryPending(repo, webhook, { deliver })).toEqual({ claimed: 1, delivered: 1, failed: 0 });
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(repo.rows.get("F")?.status).toBe("delivered");
  });

  it("يتحول إلى failed بعد استنفاد المحاولات", async () => {
    let t = 0;
    const repo = createMemoryLeadRepository(() => t);
    await submitLead(lead("H"), { repo, webhook, deliver: boom() });
    for (let i = 1; i < MAX_DELIVERY_ATTEMPTS; i++) {
      t += 10 * 60 * 60_000;
      await retryPending(repo, webhook, { deliver: boom() });
    }
    expect(repo.rows.get("H")).toMatchObject({ status: "failed", attempts: MAX_DELIVERY_ATTEMPTS });
  });
});

describe("purgeOlderThan (ذاكرة)", () => {
  it("يحذف المنتهي القديم فقط ويُبقي pending والحديث", async () => {
    let t = 0;
    const repo = createMemoryLeadRepository(() => t);
    await submitLead(lead("old-delivered"), { repo, webhook, deliver: ok });
    await submitLead(lead("old-stored"), { repo, webhook: null });
    await submitLead(lead("old-pending"), { repo, webhook, deliver: boom() });
    t = 100 * 86_400_000;
    await submitLead(lead("new-delivered"), { repo, webhook, deliver: ok });
    expect(await repo.purgeOlderThan(90)).toBe(2);
    expect([...repo.rows.keys()].sort()).toEqual(["new-delivered", "old-pending"]);
  });
});

describe("createPgLeadRepository", () => {
  it("create: INSERT ... ON CONFLICT DO NOTHING ويعيد false عند التكرار", async () => {
    const query = vi.fn().mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });
    const repo = createPgLeadRepository({ query } as never);
    expect(await repo.create(lead("P"), "pending")).toBe(true);
    expect(await repo.create(lead("P"), "pending")).toBe(false);
    expect(query.mock.calls[0][0]).toMatch(/ON CONFLICT \(reference\) DO NOTHING/);
    expect(query.mock.calls[0][1]).toEqual(["P", JSON.stringify(lead("P")), "pending"]);
  });

  it("claimPending يستخدم SKIP LOCKED ويمرّر المعاملات بترتيبها", async () => {
    const rows = [{ reference: "P", payload: lead("P"), attempts: 0 }];
    const query = vi.fn().mockResolvedValue({ rows });
    const repo = createPgLeadRepository({ query } as never);
    expect(await repo.claimPending(10, 8)).toEqual(rows);
    expect(query.mock.calls[0][0]).toMatch(/FOR UPDATE SKIP LOCKED/);
    expect(query.mock.calls[0][1]).toEqual([8, 10]);
  });

  it("purgeOlderThan: DELETE للحالات المنتهية فقط ويعيد العدد", async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 4 });
    expect(await createPgLeadRepository({ query } as never).purgeOlderThan(90)).toBe(4);
    expect(query.mock.calls[0][0]).toMatch(/status IN \('delivered', 'stored', 'failed'\)/);
    expect(query.mock.calls[0][1]).toEqual([90]);
  });

  it("markFailed لا يمس الطلبات المُسلَّمة", async () => {
    const query = vi.fn().mockResolvedValue({});
    await createPgLeadRepository({ query } as never).markFailed("P", "err", 8);
    expect(query.mock.calls[0][0]).toMatch(/status <> 'delivered'/);
  });
});
