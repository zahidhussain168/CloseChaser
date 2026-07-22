import type { MetadataRoute } from "next";

const BASE = "https://ruledoff.vercel.app";

/**
 * Crawlers may index the marketing site, but never the authenticated app, the
 * no-login client links, or the API. The client magic-link pages carry private
 * data and their own noindex; disallowing /c/ keeps tokens out of the index too.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/clients", "/settings", "/api/", "/c/", "/login", "/signup"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
