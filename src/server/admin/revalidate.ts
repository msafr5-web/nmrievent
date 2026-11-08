import { revalidatePath } from "next/cache";
import { services } from "@/content/services";

/**
 * يحدّث صفحات الموقع العام التي تعرض صور المعرض فور أي تعديل من لوحة التحكم.
 * صفحات الخدمات تُبطَل واحدة واحدة: إبطال المسار العام /services لا يغطي مسارات /services/[slug] بشكل موثوق،
 * فكانت الصور الجديدة تتأخر فيها حتى انتهاء مهلة التجديد التلقائي (60 ثانية).
 */
export function revalidatePublicGallery() {
  revalidatePath("/portfolio");
  revalidatePath("/");
  revalidatePath("/brand");
  for (const s of services) revalidatePath(`/services/${s.slug}`);
}
