import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Empty, Notice, PageHeader } from "@/components/admin/ui";
import { UploadForm } from "@/components/admin/UploadForm";
import { galleryCategories } from "@/content/gallery";
import { hasPermission } from "@/lib/permissions";
import { requireDb, requirePermission } from "@/server/admin/context";
import { countGallery, listGallery } from "@/server/admin/gallery";
import { seedGalleryAction, toggleGalleryVisibleAction } from "../../actions";

export const metadata: Metadata = { title: "معرض الصور" };
export const dynamic = "force-dynamic";

const catLabel = (id: string) => galleryCategories.find((c) => c.id === id)?.label ?? id;

export default async function GalleryAdminPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; v?: string }> }) {
  const user = await requirePermission("gallery.view");
  const sp = await searchParams;
  const db = requireDb();
  const { total } = await countGallery(db);
  const items = await listGallery(db, { category: sp.category || undefined, q: sp.q?.trim() || undefined, visible: sp.v === "hidden" ? false : sp.v === "visible" ? true : undefined });
  const canCreate = hasPermission(user, "gallery.create");
  const canEdit = hasPermission(user, "gallery.edit");

  return (
    <>
      <PageHeader title="معرض الصور" lead="الصور المعروضة في صفحة «أعمالنا» (/portfolio#gallery) والرئيسية وصفحات الخدمات. أي تعديل يظهر في الموقع خلال لحظات." />

      {total === 0 && (
        <Notice tone="warn">
          <p className="font-semibold">المعرض لم يُستورد إلى قاعدة البيانات بعد.</p>
          <p className="mt-1">الموقع يعرض الآن الصور المضمّنة في الكود. لإدارتها من هنا (تعديل وإخفاء وترتيب وحذف) استوردها مرة واحدة.</p>
          {canCreate && (
            <form action={seedGalleryAction} className="mt-3">
              <button type="submit" className="btn-primary">استيراد صور الموقع الحالية</button>
            </form>
          )}
        </Notice>
      )}

      {canCreate && <div className="mb-10"><UploadForm /></div>}

      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-[1fr_14rem_12rem_auto]" role="search">
        <input name="q" defaultValue={sp.q} placeholder="بحث في الوصف" className="field" aria-label="بحث" />
        <select name="category" defaultValue={sp.category ?? ""} className="field" aria-label="التصنيف">
          <option value="">كل التصنيفات</option>
          {galleryCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select name="v" defaultValue={sp.v ?? ""} className="field" aria-label="الظهور">
          <option value="">الظاهرة والمخفية</option>
          <option value="visible">الظاهرة فقط</option>
          <option value="hidden">المخفية فقط</option>
        </select>
        <button type="submit" className="btn-primary">تطبيق</button>
      </form>
      <p className="mb-4 text-sm text-muted" aria-live="polite">{items.length} صورة</p>

      {items.length === 0 ? (
        <Empty>لا توجد صور مطابقة.</Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((g) => (
            <li key={g.id} className={`card overflow-hidden ${g.visible ? "" : "opacity-60"}`}>
              <Link href={`/admin/gallery/${g.id}`} className="relative block aspect-[4/3] bg-elevated">
                <Image src={g.src} alt={g.alt} fill sizes="(min-width: 1536px) 22vw, (min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" unoptimized={g.src.startsWith("/media/")} className="object-cover" />
                <span className="absolute start-2 top-2 flex gap-1 text-[11px] font-bold">
                  {!g.visible && <span className="rounded-full bg-danger px-2 py-0.5 text-bg">مخفية</span>}
                  {g.featured && <span className="rounded-full bg-brand px-2 py-0.5 text-bg">الرئيسية</span>}
                  {g.source === "upload" && <span className="rounded-full bg-violet px-2 py-0.5 text-white">مرفوعة</span>}
                </span>
              </Link>
              <div className="space-y-3 p-4">
                <p className="line-clamp-2 text-sm leading-6">{g.alt}</p>
                <p className="text-xs text-muted">{catLabel(g.category)}{g.services.length ? ` · ${g.services.length} خدمة` : ""}</p>
                <div className="flex flex-wrap gap-2">
                  {canEdit && (
                    <>
                      <Link href={`/admin/gallery/${g.id}`} className="btn-ghost px-4 py-2 text-xs">تعديل</Link>
                      <form action={toggleGalleryVisibleAction}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="visible" value={String(!g.visible)} />
                        <button type="submit" className="btn-ghost px-4 py-2 text-xs">{g.visible ? "إخفاء" : "إظهار"}</button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
