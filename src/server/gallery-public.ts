import "server-only";
import { featuredGalleryIds, gallery as staticGallery, serviceGalleryIds, type GalleryCategory, type GalleryItem } from "@/content/gallery";
import { logger } from "@/lib/logger";
import { countGallery, listGallery } from "./admin/gallery";
import { getPool } from "./db";

export type PublicGallery = {
  /** كل الصور الظاهرة بترتيب العرض */
  items: GalleryItem[];
  /** الصور المختارة للصفحة الرئيسية */
  featured: GalleryItem[];
  forService(slug: string): GalleryItem[];
  byIds(ids: string[]): GalleryItem[];
};

const FEATURED_LIMIT = 6;
const SERVICE_LIMIT = 6;

function fromStatic(): PublicGallery {
  const byId = new Map(staticGallery.map((g) => [g.id, g]));
  const pick = (ids: string[]) => ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  return {
    items: staticGallery,
    featured: pick(featuredGalleryIds),
    forService: (slug) => pick(serviceGalleryIds[slug] ?? []),
    byIds: pick,
  };
}

/**
 * مصدر صور الموقع العام: قاعدة البيانات (التي تديرها لوحة التحكم) إن وُجدت وفيها صور،
 * وإلا الصور الثابتة المضمّنة. أي خطأ في القاعدة يرجع للثابتة بدل كسر الصفحة.
 */
export async function loadGallery(): Promise<PublicGallery> {
  const pool = getPool();
  if (!pool) return fromStatic();
  try {
    const { total } = await countGallery(pool);
    if (total === 0) return fromStatic();
    const rows = await listGallery(pool, { visible: true });
    const items: GalleryItem[] = rows.map((r) => ({ id: r.id, category: r.category as GalleryCategory, src: r.src, width: r.width, height: r.height, alt: r.alt }));
    const byId = new Map(items.map((g) => [g.id, g]));
    return {
      items,
      featured: rows.filter((r) => r.featured).slice(0, FEATURED_LIMIT).map((r) => byId.get(r.id)!),
      forService: (slug) => rows.filter((r) => r.services.includes(slug)).slice(0, SERVICE_LIMIT).map((r) => byId.get(r.id)!),
      byIds: (ids) => ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
    };
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "public gallery: database read failed, using static gallery");
    return fromStatic();
  }
}
