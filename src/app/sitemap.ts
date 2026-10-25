import type { MetadataRoute } from "next";
import { insights } from "@/content/insights";
import { projects } from "@/content/projects";
import { services } from "@/content/services";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "",
    "/services",
    "/portfolio",
    "/insights",
    "/about",
    "/contact",
    "/rfq",
    "/join",
    "/privacy",
    ...services.map((s) => `/services/${s.slug}`),
    ...projects.map((p) => `/portfolio/${p.slug}`),
    ...insights.map((i) => `/insights/${i.slug}`),
  ];
  return paths.map((p) => ({ url: `${site.url}${p}`, lastModified: now }));
}
