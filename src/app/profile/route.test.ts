import { describe, expect, it } from "vitest";
import { GET, PROFILE_PDF_PATH } from "./route";

describe("GET /profile (هدف رمز QR)", () => {
  it("يحوّل بمسار نسبي بغض النظر عن عنوان الطلب الداخلي (خلف الوكيل العكسي)", () => {
    const res = GET();
    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toBe(PROFILE_PDF_PATH);
    // لا يجوز أن يتسرب عنوان داخلي مثل 0.0.0.0:3000 أو localhost
    expect(location).not.toMatch(/^https?:\/\//);
  });

  it("لا يُخزَّن مؤقتًا (يمكن استبدال الملف لاحقًا)", () => {
    expect(GET().headers.get("cache-control")).toBe("no-store");
  });
});
