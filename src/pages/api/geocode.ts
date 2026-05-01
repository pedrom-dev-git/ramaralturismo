export const prerender = false;

import type { APIRoute } from "astro";

const ALLOWED_Q = /^[\p{L}\p{M}\p{N}\s,'.\-/()]+$/u;
const UPSTREAM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ramaral-turismo (https://ramaral.tur.br)";

function bad(reason: string): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

interface NominatimItem {
  display_name?: string;
  [key: string]: unknown;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const raw = url.searchParams.get("q");
  if (!raw) return bad("q required");
  const q = raw.trim();
  if (q.length < 3) return bad("q too short");
  if (q.length > 80) return bad("q too long");
  if (!ALLOWED_Q.test(q)) return bad("q has forbidden chars");

  const cacheKey = new Request(
    `https://cache.local/geocode?q=${encodeURIComponent(q.toLowerCase())}`,
  );
  const edgeCache =
    typeof caches !== "undefined" && (caches as { default?: Cache }).default
      ? (caches as { default: Cache }).default
      : null;

  if (edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) return hit;
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${UPSTREAM}?q=${encodeURIComponent(q)}&countrycodes=br&format=json&limit=5&accept-language=pt-BR`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "pt-BR",
        },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: "upstream_unreachable" }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "upstream_error" }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  let raw_data: unknown;
  try {
    raw_data = await upstream.json();
  } catch {
    return new Response(JSON.stringify({ error: "upstream_invalid_json" }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  const items = Array.isArray(raw_data) ? (raw_data as NominatimItem[]) : [];
  const normalized = items
    .filter((r) => typeof r.display_name === "string")
    .map((r) => ({ display_name: r.display_name as string }));

  const response = new Response(JSON.stringify(normalized), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });

  if (edgeCache) {
    await edgeCache.put(cacheKey, response.clone());
  }

  return response;
};
