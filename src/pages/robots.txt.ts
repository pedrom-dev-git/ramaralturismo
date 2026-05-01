export async function GET(): Promise<Response> {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "Sitemap: https://ramaral.tur.br/sitemap.xml",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
