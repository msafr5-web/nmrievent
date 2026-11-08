import { readFile } from "node:fs/promises";
import { parseServerEnv } from "@/lib/env";
import { resolveGalleryPath } from "@/server/admin/media";

export const runtime = "nodejs";

const env = parseServerEnv();

/**
 * يخدم الصور المرفوعة من لوحة التحكم فقط (gallery/<uuid>.webp). المسار يُتحقق منه بنمط صارم
 * فلا يمكن قراءة ملفات أخرى (اجتياز مسارات) ولا الوصول للمجلد الخاص (السير الذاتية).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const full = resolveGalleryPath(env.UPLOAD_DIR, segments.join("/"));
  if (!full) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(full);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        // الأسماء عشوائية وغير قابلة للتغيير: تخزين طويل آمن
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
