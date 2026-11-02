import { describe, expect, it, vi } from "vitest";
import { createRedisRateLimiter } from "./rate-limit-redis";

const reply = (count: unknown, status = 200) =>
  new Response(JSON.stringify([{ result: count }, { result: 1 }]), { status });
const mk = (fetchImpl: typeof fetch) =>
  createRedisRateLimiter({ url: "https://r.test/", token: "tok", limit: 2, windowMs: 1000, fetchImpl });

describe("createRedisRateLimiter", () => {
  it("يمنع عند تجاوز العدّاد للحد ويرسل INCR + PEXPIRE NX بالتوثيق", async () => {
    const f = vi.fn().mockResolvedValueOnce(reply(2)).mockResolvedValueOnce(reply(3));
    const l = mk(f as unknown as typeof fetch);
    expect(await l.isLimited("1.1.1.1")).toBe(false);
    expect(await l.isLimited("1.1.1.1")).toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://r.test/pipeline");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual([["INCR", "rl:rfq:1.1.1.1"], ["PEXPIRE", "rl:rfq:1.1.1.1", "1000", "NX"]]);
  });

  it("يرمي عند فشل Redis أو رد غير صالح", async () => {
    await expect(mk(vi.fn().mockResolvedValue(reply(1, 500)) as unknown as typeof fetch).isLimited("a")).rejects.toThrow();
    await expect(mk(vi.fn().mockResolvedValue(reply("x")) as unknown as typeof fetch).isLimited("a")).rejects.toThrow();
  });
});
