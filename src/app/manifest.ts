import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${site.name} — ${site.nameAr}`,
    short_name: "NMR Events",
    description: site.description,
    lang: "ar",
    dir: "rtl",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070B3F",
    theme_color: "#070B3F",
    categories: ["business", "events"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "اطلب عرض سعر", url: "/rfq", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "معرض الأعمال", url: "/portfolio", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "تواصل معنا", url: "/contact", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
