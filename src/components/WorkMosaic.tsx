import Image from "next/image";
import Link from "next/link";
import type { GalleryItem } from "@/content/gallery";

/** شبكة صور ثابتة (خادم) تُستخدم في الرئيسية وصفحات الخدمات؛ كل صورة تقود إلى معرض الصور الكامل */
export function WorkMosaic({ items, columns = 3 }: { items: GalleryItem[]; columns?: 2 | 3 }) {
  return (
    <ul className={`grid grid-cols-2 gap-3 md:gap-4 ${columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href="/portfolio#gallery"
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes={columns === 3 ? "(min-width: 768px) 33vw, 50vw" : "(min-width: 768px) 50vw, 50vw"}
              unoptimized={item.src.startsWith("/media/")}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-xs leading-5 text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:text-sm">
              {item.alt}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
