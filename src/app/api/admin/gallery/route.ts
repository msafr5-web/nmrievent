import { NextResponse } from "next/server";
import { galleryCreateSchema } from "@/lib/gallery-schema";
import { fieldErrors } from "@/lib/applications";
import { logger } from "@/lib/logger";
import { createGalleryItem } from "@/server/admin/gallery";
import { limiter } from "@/server/admin/limiters";
import { deleteGalleryFile, IMAGE_MAX_BYTES, MediaError, processGalleryImage, saveGalleryFile } from "@/server/admin/media";
import { revalidatePublicGallery } from "@/server/admin/revalidate";
import { actorOf, AdminError } from "@/server/admin/users";
import { authorize, clientIp, requireDb, serverEnv } from "@/server/admin/context";
import { isSameOrigin } from "@/server/admin/request";
import { headers } from "next/headers";

export const runtime = "nodejs";

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** رفع صورة جديدة إلى معرض الصور: جلسة + صلاحية gallery.create + فحص Origin + معالجة الصورة (إزالة EXIF وتحويل WebP) */
export async function POST(req: Request) {
  if (!isSameOrigin(await headers())) return json({ error: "طلب غير مقبول." }, 403);
  let user;
  try {
    user = await authorize("gallery.create");
  } catch (e) {
    return json({ error: e instanceof AdminError ? e.message : "غير مصرح." }, 403);
  }
  if (limiter.upload.isLimited(user.id)) return json({ error: "عدد كبير من عمليات الرفع، حاول بعد قليل." }, 429);
  if (Number(req.headers.get("content-length") ?? 0) > IMAGE_MAX_BYTES + 512 * 1024) return json({ error: "حجم الصورة أكبر من 10 م.ب." }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "صيغة الطلب غير صالحة." }, 400);
  }
  const meta = galleryCreateSchema.safeParse({
    category: form.get("category"),
    alt: form.get("alt"),
    featured: form.get("featured") ?? undefined,
    visible: form.get("visible") ?? undefined,
    services: form.getAll("services"),
  });
  if (!meta.success) return json({ error: "راجع بيانات الصورة.", fields: fieldErrors(meta.error) }, 422);
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return json({ error: "اختر صورة للرفع.", fields: { file: "اختر صورة" } }, 422);

  const root = serverEnv().UPLOAD_DIR;
  let saved: { src: string } | null = null;
  try {
    const img = await processGalleryImage(Buffer.from(await file.arrayBuffer()));
    saved = await saveGalleryFile(root, img.buffer);
    const item = await createGalleryItem(requireDb(), actorOf(user), { ...meta.data, src: saved.src, width: img.width, height: img.height }, await clientIp());
    revalidatePublicGallery();
    return json({ ok: true, id: item.id }, 201);
  } catch (err) {
    if (saved) await deleteGalleryFile(root, saved.src);
    if (err instanceof MediaError) return json({ error: err.message, fields: { file: err.message } }, 422);
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "gallery upload failed");
    return json({ error: "تعذر حفظ الصورة." }, 500);
  }
}
