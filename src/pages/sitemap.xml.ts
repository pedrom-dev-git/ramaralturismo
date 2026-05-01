const SITE = "https://ramaralturismo.job-3eb.workers.dev";

interface SitemapEntry {
  path: string;
  lang: string;
}

const pages: SitemapEntry[] = [
  { path: "/", lang: "pt-BR" },
  { path: "/en/", lang: "en" },
  { path: "/es/", lang: "es" },
];

function buildAlternates(currentPath: string): string {
  return pages
    .map(
      (p) =>
        `      <xhtml:link rel="alternate" hreflang="${p.lang}" href="${SITE}${p.path}"/>`,
    )
    .join("\n");
}

function buildUrlEntry(entry: SitemapEntry): string {
  return `  <url>
    <loc>${SITE}${entry.path}</loc>
${buildAlternates(entry.path)}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>
  </url>`;
}

export async function GET(): Promise<Response> {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${pages.map(buildUrlEntry).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
