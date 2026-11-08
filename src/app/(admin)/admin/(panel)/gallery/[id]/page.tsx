import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Notice, PageHeader, fmtDate } from "@/components/admin/ui";
import { galleryCategories } from "@/content/gallery";
import { services } from "@/content/services";
import { hasPermission } from "@/lib/permissions";
import { requireDb, requirePermission } from "@/server/admin/context";
import { getGalleryItem } from "@/server/admin/gallery";
import { deleteGalleryAction, updateGalleryAction } from "../../../actions";

export const metadata: Metadata = { title: "تعديل صورة" };
export const dynamic = "force-dynamic";

export default async function GalleryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("gallery.view");
  const { id } = await params;
  const item = await getGalleryItem(requireDb(), id);
  if (!item) notFound();
  const canEdit = hasPermission(user, "gallery.edit");
  const canDelete = hasPermission(user, "gallery.delete");

  return (
    <>
      <PageHeader title="تعديل صورة" actions={<Link href="/admin/gallery" className="btn-ghost">← المعرض</Link>} />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card overflow-hidden">
          <div className="relative aspect-[4/3] bg-elevated">
            <Image src={item.src} alt={item.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" unoptimized={item.src.startsWith("/media/")} className="object-contain" />
          </div>
          <dl className="grid grid-cols-2 gap-3 p-5 text-sm">
            <dt className="text-muted">المصدر</dt><dd>{item.source === "upload" ? "مرفوعة من اللوحة" : "من الموقع الأصلي"}</dd>
            <dt className="text-muted">الأبعاد</dt><dd dir="ltr">{item.width}×{item.height}</dd>
            <dt className="text-muted">آخر تعديل</dt><dd>{fmtDate(item.updatedAt)}</dd>
          </dl>
        </div>

        <div className="space-y-6">
          {!canEdit && <Notice>لديك صلاحية العرض فقط.</Notice>}
          <fieldset disabled={!canEdit} className="card p-6">
            <ActionForm action={updateGalleryAction} submit="حفظ التعديلات">
              <input type="hidden" name="id" value={item.id} />
              <div>
                <label htmlFor="category" className="label">التصنيف</label>
                <select id="category" name="category" defaultValue={item.category} className="field">
                  {galleryCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="alt" className="label">الوصف</label>
                <textarea id="alt" name="alt" rows={3} required minLength={5} maxLength={200} defaultValue={item.alt} className="field" />
              </div>
              <div>
                <label htmlFor="sortOrder" className="label">ترتيب العرض (الأصغر أولًا)</label>
                <input id="sortOrder" name="sortOrder" type="number" step={10} defaultValue={item.sortOrder} dir="ltr" className="field" />
              </div>
              <fieldset>
                <legend className="label">تظهر في صفحات الخدمات</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {services.map((s) => (
                    <label key={s.slug} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="services" value={s.slug} defaultChecked={item.services.includes(s.slug)} className="h-4 w-4 accent-[rgb(var(--brand))]" />{s.title}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="visible" defaultChecked={item.visible} className="h-4 w-4 accent-[rgb(var(--brand))]" />ظاهرة في الموقع</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={item.featured} className="h-4 w-4 accent-[rgb(var(--brand))]" />تظهر في الصفحة الرئيسية</label>
              </div>
            </ActionForm>
          </fieldset>

          {canDelete && (
            <form action={deleteGalleryAction} className="card border-danger/40 p-6">
              <h2 className="text-lg font-bold text-danger">حذف الصورة</h2>
              <p className="mt-2 text-sm leading-7 text-muted">يُحذف السجل {item.source === "upload" ? "والملف المرفوع" : "(الملف الأصلي المضمّن في الموقع يبقى لكن لن يُعرض)"} نهائيًا. للإخفاء المؤقت استخدم «ظاهرة في الموقع».</p>
              <input type="hidden" name="id" value={item.id} />
              <div className="mt-4"><ConfirmButton message="حذف هذه الصورة نهائيًا؟">حذف نهائي</ConfirmButton></div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
