import { getRequestConfig } from "next-intl/server";

const locales = ["en", "am", "or"] as const;
type Locale = (typeof locales)[number];

function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

export default getRequestConfig(async ({ locale }) => {
  const safeLocale: Locale = isLocale(locale) ? locale : "or";

  return {
    locale: safeLocale,
    messages: (await import(`./${safeLocale}.json`)).default,
  };
});