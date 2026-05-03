const SITE = "https://ramaral.tur.br";

interface SitemapEntry {
  path: string;
  lang: string;
}

interface PageFamily {
  pt: string;
  en: string;
  es: string;
}

const families: PageFamily[] = [
  { pt: "/", en: "/en/", es: "/es/" },
  {
    pt: "/credenciais/",
    en: "/en/credenciais/",
    es: "/es/credenciais/",
  },
  {
    pt: "/sobre/",
    en: "/en/sobre/",
    es: "/es/sobre/",
  },
];

const pages: SitemapEntry[] = families.flatMap((f) => [
  { path: f.pt, lang: "pt-BR" },
  { path: f.en, lang: "en" },
  { path: f.es, lang: "es" },
]);

function buildAlternates(currentPath: string): string {
  const family = families.find(
    (f) => f.pt === currentPath || f.en === currentPath || f.es === currentPath,
  );
  if (!family) return "";
  const langs: SitemapEntry[] = [
    { path: family.pt, lang: "pt-BR" },
    { path: family.en, lang: "en" },
    { path: family.es, lang: "es" },
  ];
  const alternates = langs
    .map(
      (p) =>
        `      <xhtml:link rel="alternate" hreflang="${p.lang}" href="${SITE}${p.path}"/>`,
    )
    .join("\n");
  return (
    alternates +
    `\n      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${family.pt}"/>`
  );
}

function buildUrlEntry(entry: SitemapEntry): string {
  return `  <url>
    <loc>${SITE}${entry.path}</loc>
${buildAlternates(entry.path)}
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
