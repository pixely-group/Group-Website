import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/company";
import { MENU } from "@/lib/menu";

/** Built from the menu, so a page added there is listed here without a
 *  second edit: every route the menu points at, plus the home page. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = new Set(["/"]);
  for (const column of MENU) for (const link of column.links) if (link.href?.startsWith("/")) routes.add(link.href);
  return [...routes].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/platform") || path.startsWith("/solutions") ? 0.8 : 0.5,
  }));
}
