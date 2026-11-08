import { randomBytes } from "node:crypto";
import type { Db } from "../db";
import { audit, type Actor } from "./audit";
import { AdminError } from "./users";

export type GalleryRecord = {
  id: string;
  category: string;
  alt: string;
  src: string;
  width: number;
  height: number;
  sortOrder: number;
  visible: boolean;
  featured: boolean;
  services: string[];
  source: "seed" | "upload";
  createdAt: Date;
  updatedAt: Date;
};

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const COLS = "id, category, alt, src, width, height, sort_order, visible, featured, services, source, created_at, updated_at";

const map = (r: Row): GalleryRecord => ({
  id: r.id,
  category: r.category,
  alt: r.alt,
  src: r.src,
  width: r.width,
  height: r.height,
  sortOrder: r.sort_order,
  visible: r.visible,
  featured: r.featured,
  services: r.services ?? [],
  source: r.source,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listGallery(db: Db, opts: { category?: string; q?: string; visible?: boolean } = {}): Promise<GalleryRecord[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.category) where.push(`category = $${params.push(opts.category)}`);
  if (opts.visible !== undefined) where.push(`visible = $${params.push(opts.visible)}`);
  if (opts.q) where.push(`alt ILIKE $${params.push(`%${opts.q.replace(/[%_\\]/g, "\\$&")}%`)}`);
  const { rows } = await db.query(
    `SELECT ${COLS} FROM gallery_items ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY sort_order, created_at DESC`,
    params,
  );
  return rows.map(map);
}

export async function getGalleryItem(db: Db, id: string): Promise<GalleryRecord | null> {
  const { rows } = await db.query(`SELECT ${COLS} FROM gallery_items WHERE id = $1`, [id]);
  return rows[0] ? map(rows[0]) : null;
}

export async function countGallery(db: Db): Promise<{ total: number; visible: number }> {
  const { rows } = await db.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE visible)::int AS visible FROM gallery_items`);
  return rows[0];
}

export type NewGalleryItem = {
  category: string;
  alt: string;
  src: string;
  width: number;
  height: number;
  featured?: boolean;
  services?: string[];
  visible?: boolean;
};

const newId = () => `u-${randomBytes(6).toString("hex")}`;

/** الصور الجديدة تُوضع في أول المعرض (أقل sort_order) */
export async function createGalleryItem(db: Db, actor: Actor, input: NewGalleryItem, ip?: string | null): Promise<GalleryRecord> {
  const id = newId();
  const { rows } = await db.query(
    `INSERT INTO gallery_items (id, category, alt, src, width, height, sort_order, visible, featured, services, source, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MIN(sort_order), 0) - 10 FROM gallery_items), $7, $8, $9, 'upload', $10)
     RETURNING ${COLS}`,
    [id, input.category, input.alt.trim(), input.src, input.width, input.height, input.visible ?? true, input.featured ?? false, input.services ?? [], actor.id],
  );
  await audit(db, actor, "gallery.create", { entity: "gallery", entityId: id, details: { category: input.category }, ip });
  return map(rows[0]);
}

export type GalleryPatch = Partial<{ category: string; alt: string; sortOrder: number; visible: boolean; featured: boolean; services: string[] }>;

export async function updateGalleryItem(db: Db, actor: Actor, id: string, patch: GalleryPatch, ip?: string | null): Promise<GalleryRecord> {
  const current = await getGalleryItem(db, id);
  if (!current) throw new AdminError("الصورة غير موجودة.", "not-found");
  const next = { ...current, ...patch };
  const { rows } = await db.query(
    `UPDATE gallery_items SET category = $2, alt = $3, sort_order = $4, visible = $5, featured = $6, services = $7, updated_at = now()
      WHERE id = $1 RETURNING ${COLS}`,
    [id, next.category, next.alt.trim(), next.sortOrder, next.visible, next.featured, next.services],
  );
  await audit(db, actor, "gallery.update", { entity: "gallery", entityId: id, details: { changed: Object.keys(patch) }, ip });
  return map(rows[0]);
}

/** يعيد السجل المحذوف ليحذف المستدعي الملف الفعلي إن كان مرفوعًا */
export async function deleteGalleryItem(db: Db, actor: Actor, id: string, ip?: string | null): Promise<GalleryRecord> {
  const { rows } = await db.query(`DELETE FROM gallery_items WHERE id = $1 RETURNING ${COLS}`, [id]);
  if (!rows[0]) throw new AdminError("الصورة غير موجودة.", "not-found");
  await audit(db, actor, "gallery.delete", { entity: "gallery", entityId: id, details: { source: rows[0].source }, ip });
  return map(rows[0]);
}

export type SeedItem = { id: string; category: string; alt: string; src: string; width: number; height: number; featured: boolean; services: string[] };

/** استيراد الصور الثابتة الحالية إلى القاعدة مرة واحدة (آمن للتكرار) */
export async function seedGallery(db: Db, actor: Actor, items: SeedItem[]): Promise<number> {
  let inserted = 0;
  for (const [i, it] of items.entries()) {
    const res = await db.query(
      `INSERT INTO gallery_items (id, category, alt, src, width, height, sort_order, featured, services, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'seed') ON CONFLICT (id) DO NOTHING`,
      [it.id, it.category, it.alt, it.src, it.width, it.height, i * 10, it.featured, it.services],
    );
    inserted += res.rowCount ?? 0;
  }
  if (inserted > 0) await audit(db, actor, "gallery.seed", { entity: "gallery", details: { inserted } });
  return inserted;
}
