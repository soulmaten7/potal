import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/settings", "/saved", "/wishlist", "/account"],
      },
    ],
    sitemap: "https://potal.app/sitemap.xml",
  };
}
