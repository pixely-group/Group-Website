import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/company";

/** Everything public is crawlable; the design lab, the signed-in area and
 *  the API are not pages for a search engine. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/lab/", "/api/", "/dashboard", "/profile", "/settings"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
