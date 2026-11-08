import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { deleteCvFile, deleteGalleryFile, MediaError, processGalleryImage, resolveCvPath, resolveGalleryPath, saveCvFile, saveGalleryFile } from "./media";

const root = mkdtempSync(join(tmpdir(), "nmr-media-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const png = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#f05a22" } }).png().toBuffer();

describe("معالجة الصور", () => {
  it("يحوّل PNG كبيرة إلى WebP بعرض أقصى 1600 ويحافظ على النسبة", async () => {
    const out = await processGalleryImage(await png(3200, 1800));
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe("webp");
    expect([out.width, out.height]).toEqual([1600, 900]);
    expect(meta.width).toBe(1600);
  });

  it("لا يكبّر الصور الصغيرة", async () => {
    const out = await processGalleryImage(await png(800, 600));
    expect([out.width, out.height]).toEqual([800, 600]);
  });

  it("يزيل بيانات EXIF (الموقع وغيره) ويطبّق الاتجاه", async () => {
    const withExif = await sharp({ create: { width: 900, height: 500, channels: 3, background: "#123456" } })
      .jpeg()
      .withExif({ IFD0: { Copyright: "secret-owner", ImageDescription: "private-gps-note" } })
      .withMetadata({ orientation: 6 })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const out = await processGalleryImage(withExif);
    const meta = await sharp(out.buffer).metadata();
    expect(meta.exif).toBeUndefined();
    expect(out.buffer.includes(Buffer.from("secret-owner"))).toBe(false);
    expect([out.width, out.height]).toEqual([500, 900]); // دُوّرت حسب اتجاه EXIF
  });

  it.each([
    ["SVG", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><script>alert(1)</script></svg>')],
    ["نص", Buffer.from("not an image at all")],
    ["PDF", Buffer.from("%PDF-1.4 fake")],
    ["فارغ", Buffer.alloc(0)],
  ])("يرفض %s", async (_n, buf) => {
    await expect(processGalleryImage(buf)).rejects.toBeInstanceOf(MediaError);
  });

  it("يرفض الصور الصغيرة جدًا وGIF", async () => {
    await expect(processGalleryImage(await png(100, 100))).rejects.toThrow(/صغيرة/);
    const gif = await sharp({ create: { width: 500, height: 500, channels: 3, background: "#fff" } }).gif().toBuffer();
    await expect(processGalleryImage(gif)).rejects.toThrow(/الصيغ المسموحة/);
  });

  it("يرفض ما يتجاوز 10 م.ب", async () => {
    await expect(processGalleryImage(Buffer.alloc(10 * 1024 * 1024 + 1, 1))).rejects.toThrow(/10/);
  });
});

describe("التخزين", () => {
  it("يحفظ الصورة بمعرّف عشوائي ويحذفها", async () => {
    const { src, rel } = await saveGalleryFile(root, Buffer.from("webp-bytes"));
    expect(src).toMatch(/^\/media\/gallery\/[0-9a-f-]{36}\.webp$/);
    const full = resolveGalleryPath(root, rel)!;
    expect(existsSync(full)).toBe(true);
    expect(readFileSync(full).toString()).toBe("webp-bytes");
    await deleteGalleryFile(root, src);
    expect(existsSync(full)).toBe(false);
    await deleteGalleryFile(root, "/other/path"); // لا يفعل شيئًا
  });

  it("يمنع اجتياز المسارات", () => {
    for (const bad of ["../secret.txt", "gallery/../../etc/passwd", "gallery/x.webp", "gallery/00000000-0000-0000-0000-000000000000.png", "/etc/passwd", "private/cv/00000000-0000-0000-0000-000000000000.pdf"]) {
      expect(resolveGalleryPath(root, bad), bad).toBeNull();
    }
    expect(resolveCvPath(root, "gallery/00000000-0000-0000-0000-000000000000.webp")).toBeNull();
    expect(resolveCvPath(root, "private/cv/../../x.pdf")).toBeNull();
  });

  it("السيرة الذاتية: PDF فقط وحتى 5 م.ب وتُحفظ في مسار خاص", async () => {
    const { rel } = await saveCvFile(root, Buffer.from("%PDF-1.7 ok"));
    expect(rel).toMatch(/^private\/cv\//);
    expect(existsSync(resolveCvPath(root, rel)!)).toBe(true);
    await deleteCvFile(root, rel);
    expect(existsSync(resolveCvPath(root, rel)!)).toBe(false);
    await expect(saveCvFile(root, Buffer.from("MZ-exe-disguised.pdf"))).rejects.toThrow(/PDF/);
    await expect(saveCvFile(root, Buffer.alloc(5 * 1024 * 1024 + 1, 0x25))).rejects.toThrow(/5/);
  });
});
