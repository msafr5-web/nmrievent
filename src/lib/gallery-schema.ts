import { z } from "zod";
import { galleryCategories } from "@/content/gallery";
import { services } from "@/content/services";

const categoryIds = galleryCategories.map((c) => c.id) as [string, ...string[]];
const serviceSlugs = services.map((s) => s.slug) as [string, ...string[]];

/** checkbox في نموذج HTML: يصل "on" عند التحديد ولا يصل عند عدمه */
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true || v === "1", z.boolean());

const base = {
  category: z.enum(categoryIds, { message: "اختر تصنيفًا" }),
  alt: z.string().trim().min(5, "اكتب وصفًا لا يقل عن 5 أحرف (يظهر للقراء الآليين وفي التكبير)").max(200),
  // غياب الخانة غير المحددة في نموذج HTML يعني false (لا نستخدم default حتى لا يتعذّر إخفاء الصورة)
  featured: checkbox,
  visible: checkbox,
  services: z.array(z.enum(serviceSlugs)).default([]).transform((a) => [...new Set(a)]),
};

export const galleryCreateSchema = z.object(base);
export const galleryUpdateSchema = z.object({ ...base, sortOrder: z.coerce.number().int().min(-100000).max(100000) });
export type GalleryCreateInput = z.infer<typeof galleryCreateSchema>;
export type GalleryUpdateInput = z.infer<typeof galleryUpdateSchema>;
