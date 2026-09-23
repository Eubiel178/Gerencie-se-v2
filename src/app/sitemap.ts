import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/shared/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = appUrl();
  const now = new Date();

  const publicPages = [
    { path: "/", changeFrequency: "monthly" as const, priority: 1 },
    {
      path: "/privacy-policy",
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      path: "/terms-of-service",
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
  ];

  return publicPages.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
