import type { MetadataRoute } from "next";
import { computedSignals } from "@/data/mockSignals";
import { OFFICIALS } from "@/data/committees";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/officials`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const signalRoutes: MetadataRoute.Sitemap = computedSignals.map((s) => ({
    url: `${BASE}/signal/${s.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const officialRoutes: MetadataRoute.Sitemap = Object.keys(OFFICIALS).map((name) => ({
    url: `${BASE}/official/${name.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...signalRoutes, ...officialRoutes];
}
