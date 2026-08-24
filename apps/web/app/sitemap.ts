import type { MetadataRoute } from "next";
import { seoPages } from "../lib/seo-pages";

const base = "https://atlas.moda";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/use-cases`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/guides/what-is-an-ai-chief-of-staff`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
  return [
    ...staticPages,
    ...seoPages.map((page) => ({
      url: `${base}/use-cases/${page.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
