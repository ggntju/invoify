import type { MetadataRoute } from "next";

import { languageAlternates, localePath } from "@/lib/seo";
import { BASE_URL, LOCALES } from "@/lib/variables";

/**
 * One entry per locale, each carrying the full hreflang set.
 *
 * There was no sitemap at all, and `app/robots.txt` had no `Sitemap:` line to
 * point at one, so the eighteen locale pages had to be discovered by crawling.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const languages = languageAlternates();
    const lastModified = new Date();

    return LOCALES.map(({ code }) => ({
        url: `${BASE_URL}${localePath(code)}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: code === "en" ? 1 : 0.8,
        alternates: {
            languages: Object.fromEntries(
                Object.entries(languages).map(([lang, path]) => [
                    lang,
                    `${BASE_URL}${path}`,
                ])
            ),
        },
    }));
}
