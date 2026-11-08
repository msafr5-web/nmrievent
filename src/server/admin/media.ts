import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { CV_MAX_BYTES } from "@/lib/applications-shared";

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 60_000_000;
const MIN_SIDE = 300;

export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaError";
  }
}

/**
 * يتحقق من أن الملف صورة حقيقية (JPEG/PNG/WebP فقط، لا SVG)، يصحّح الاتجاه، يزيل بيانات EXIF (الموقع وغيره)،
 * ويحوّلها إلى WebP بعرض أقصى 1600px. لا يُحفظ أي شيء من الملف الأصلي.
 */
export async function processGalleryImage(input: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (input.length === 0) throw new MediaError("الملف فارغ.");
  if (input.length > IMAGE_MAX_BYTES) throw new MediaError("حجم الصورة أكبر من 10 م.ب.");
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new MediaError("الملف ليس صورة صالحة.");
  }
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new MediaError("الصيغ المسموحة: JPG وPNG وWebP.");
  if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < MIN_SIDE) throw new MediaError(`أبعاد الصورة صغيرة (الحد الأدنى ${MIN_SIDE}px).`);
  try {
    const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate() // يطبّق اتجاه EXIF ثم يُحذف
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, width: info.width, height: info.height };
  } catch {
    throw new MediaError("تعذرت معالجة الصورة.");
  }
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const GALLERY_REL = new RegExp(`^gallery/${UUID}\\.webp$`);
const CV_REL = new RegExp(`^private/cv/${UUID}\\.pdf$`);

function inside(root: string, rel: string): string | null {
  const base = path.resolve(root);
  const full = path.resolve(base, rel);
  return full.startsWith(base + path.sep) ? full : null;
}

/** مسار ملف صورة عامة داخل مجلد الرفع، أو null إن كان المسار غير مطابق (يمنع اجتياز المسارات) */
export function resolveGalleryPath(root: string, rel: string): string | null {
  return GALLERY_REL.test(rel) ? inside(root, rel) : null;
}

/** مسار السيرة الذاتية الخاصة داخل مجلد الرفع، أو null */
export function resolveCvPath(root: string, rel: string): string | null {
  return CV_REL.test(rel) ? inside(root, rel) : null;
}

export async function saveGalleryFile(root: string, buffer: Buffer): Promise<{ src: string; rel: string }> {
  const rel = `gallery/${randomUUID()}.webp`;
  const full = inside(root, rel)!;
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer, { flag: "wx" });
  return { src: `/media/${rel}`, rel };
}

export async function deleteGalleryFile(root: string, src: string): Promise<void> {
  if (!src.startsWith("/media/")) return;
  const full = resolveGalleryPath(root, src.slice("/media/".length));
  if (full) await rm(full, { force: true });
}

/** يقبل PDF فقط (التوقيع %PDF-) حتى 5 م.ب، ويحفظه خارج أي مسار عام */
export async function saveCvFile(root: string, buffer: Buffer): Promise<{ rel: string }> {
  if (buffer.length === 0 || buffer.length > CV_MAX_BYTES) throw new MediaError("حجم السيرة الذاتية يجب ألا يتجاوز 5 م.ب.");
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") throw new MediaError("السيرة الذاتية يجب أن تكون بصيغة PDF.");
  const rel = `private/cv/${randomUUID()}.pdf`;
  const full = inside(root, rel)!;
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer, { flag: "wx" });
  return { rel };
}

export async function deleteCvFile(root: string, rel: string | null | undefined): Promise<void> {
  if (!rel) return;
  const full = resolveCvPath(root, rel);
  if (full) await rm(full, { force: true });
}
