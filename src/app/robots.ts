import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/shared/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = appUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/home/", "/api/", "/offline"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
