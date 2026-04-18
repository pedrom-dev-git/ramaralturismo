import ptBR from "./translations/pt-BR";
import en from "./translations/en";
import es from "./translations/es";

export type Locale = "pt-BR" | "en" | "es";
export type TranslationKey = keyof typeof ptBR;

const translations: Record<Locale, Record<string, string>> = {
  "pt-BR": ptBR,
  en,
  es,
};

export const locales: Locale[] = ["pt-BR", "en", "es"];
export const defaultLocale: Locale = "pt-BR";

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations[defaultLocale][key] ?? key;
}

export function getLocale(url: URL): Locale {
  const [, segment] = url.pathname.split("/");
  if (segment === "en") return "en";
  if (segment === "es") return "es";
  return "pt-BR";
}

export function localizedPath(locale: Locale, path: string = "/"): string {
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}

export function getHtmlLang(locale: Locale): string {
  if (locale === "pt-BR") return "pt-BR";
  return locale;
}

/**
 * Like t(), but replaces {var} placeholders with values from vars.
 * Example: tInterp('en', 'hero.msg.turismo', { origem: 'SP', destino: 'RJ' })
 */
export function tInterp(
  locale: Locale,
  key: TranslationKey,
  vars: Record<string, string>,
): string {
  let str = t(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}
