import { describe, expect, it } from "vitest";
import { generateOtp, hashOtp, signQr, verifyQr } from "@/server/auth";
import { signSession, verifySession } from "@/lib/session";

describe("رموز QR الموقعة", () => {
  it("تتحقق من الرمز السليم ولا تحمل بيانات شخصية", () => {
    const t = signQr("ASSIGN", "prj_x", "stf_y");
    expect(verifyQr(t)).toEqual({ kind: "ASSIGN", ids: ["prj_x", "stf_y"] });
    expect(t).not.toMatch(/@|05\d/);
  });
  it("ترفض الرمز المعدل", () => {
    const t = signQr("STAFF", "stf_a");
    expect(verifyQr(t.replace("stf_a", "stf_b"))).toBeNull();
    expect(verifyQr("NMRI-STAFF.stf_a.bad")).toBeNull();
    expect(verifyQr("garbage")).toBeNull();
  });
});

describe("رمز التحقق OTP", () => {
  it("أربعة أرقام، والتجزئة مرتبطة بالبريد", () => {
    const c = generateOtp();
    expect(c).toMatch(/^\d{4}$/);
    expect(hashOtp("a@x.sa", c)).not.toBe(hashOtp("b@x.sa", c));
  });
});

describe("جلسات JWT", () => {
  it("توقيع وتحقق، ورفض العبث", async () => {
    const tok = await signSession({ role: "client", sub: "NMR-26-DEMO1", name: "عميل" });
    expect(await verifySession(tok)).toMatchObject({ role: "client", sub: "NMR-26-DEMO1" });
    expect(await verifySession(tok.slice(0, -2) + "xx")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});
