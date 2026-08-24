import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/use-cases/", "/privacy", "/security", "/terms"], disallow: ["/api/", "/decisions/", "/onboarding/", "/first-scan/", "/login", "/setup"] },
      { userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended"], allow: ["/", "/use-cases/", "/privacy", "/security", "/terms", "/llms.txt"], disallow: ["/api/", "/decisions/", "/onboarding/", "/first-scan/", "/login", "/setup"] },
    ],
    sitemap: "https://atlas.moda/sitemap.xml",
    host: "https://atlas.moda",
  };
}
