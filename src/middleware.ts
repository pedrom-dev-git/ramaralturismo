import { defineMiddleware } from "astro:middleware";

const isDev = import.meta.env.DEV;

const SCRIPT_SRC = isDev
  ? "'self' 'unsafe-eval' 'unsafe-inline' static.cloudflareinsights.com"
  : "'self' static.cloudflareinsights.com";

const CSP = [
  "default-src 'self'",
  `script-src ${SCRIPT_SRC}`,
  "connect-src 'self' nominatim.openstreetmap.org cloudflareinsights.com ws: wss:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  // HSTS sempre — browsers ignoram em HTTP local (sem efeito em dev),
  // cacheiam em HTTPS produção. Phase 1 do Oficial parecer 2026-05-01.
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=300; includeSubDomains",
  );
  return response;
});
