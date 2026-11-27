// Çok dil altyapısı: ortak sözlükler ve çevirici. Arayüz metinleri burada tutulur;
// koçun ve danışanın yazdığı içerik (notlar, mesajlar) yazıldığı dilde kalır.
import { en } from "./en";
import { tr } from "./tr";

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_NAMES: Record<Locale, string> = { tr: "Türkçe", en: "English" };

export type MessageKey = keyof typeof tr;
export type Messages = Record<MessageKey, string>;
export const MESSAGES: Record<Locale, Messages> = { tr, en };

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** "en-US", "tr", Accept-Language başlığı gibi bir girdiden desteklenen dili seçer. */
export function pickLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  for (const part of input.toLowerCase().split(",")) {
    const code = part.trim().slice(0, 2);
    if ((LOCALES as readonly string[]).includes(code)) return code as Locale;
  }
  return DEFAULT_LOCALE;
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Çevirici: {ad} biçimindeki yer tutucuları doldurur; eksik anahtarda Türkçe metne düşer. */
export function createT(locale: Locale): TFunction {
  const dict = MESSAGES[locale] ?? tr;
  return (key, vars) => {
    let s = dict[key] ?? tr[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}

/** Intl biçimlendiricileri için yerel ayar. */
export function intlLocale(locale: Locale) {
  return locale === "tr" ? "tr-TR" : "en-GB";
}

/** Hareket/besin gibi içerikte dil başına ad: name_i18n.{locale} yoksa name. */
export function localizedName(row: { name: string; name_i18n?: unknown }, locale: Locale) {
  const map = row.name_i18n as Record<string, string> | null | undefined;
  return (map && typeof map[locale] === "string" && map[locale]) || row.name;
}

/** Veritabanının Türkçe hata iletilerini kullanıcının diline çevirir (bilinmeyen ileti olduğu gibi kalır). */
const DB_ERRORS: [RegExp, MessageKey][] = [
  [/Davet kodu geçersiz/i, "err.inviteInvalid"],
  [/Kendi davet kodunuzu/i, "err.inviteOwn"],
  [/Yalnızca koçlar davet/i, "err.coachOnly"],
  [/kendi alanlarını içerebilir/i, "err.inviteDomains"],
  [/En az bir alan/i, "err.pickDomain"],
  [/Bu alan henüz kullanılamıyor/i, "err.domainDisabled"],
  [/Görev tipi bu alanda kullanılamaz/i, "err.taskTypeDomain"],
  [/Bu alan bu koçluğa verilmemiş/i, "err.domainNotInCoaching"],
  [/Bu alışkanlığın hedefi değiştirilemez/i, "err.habitTarget"],
  [/Giriş gerekli/i, "err.loginRequired"],
  [/row-level security/i, "err.forbidden"],
];
export function translateError(message: string, t: TFunction) {
  for (const [re, key] of DB_ERRORS) if (re.test(message)) return t(key);
  if (/invalid login credentials/i.test(message)) return t("auth.err.credentials");
  if (/email not confirmed/i.test(message)) return t("auth.err.notConfirmed");
  if (/already registered/i.test(message)) return t("auth.err.exists");
  if (/password should be at least/i.test(message)) return t("auth.err.passwordShort");
  if (/rate limit/i.test(message)) return t("auth.err.rateLimit");
  return message;
}

/** Haftanın günü adı (i: 0 = Pazartesi). */
export function weekdayName(intl: string, i: number, style: "long" | "short" = "long") {
  // 1 Ocak 2024 pazartesi
  return new Intl.DateTimeFormat(intl, { weekday: style }).format(new Date(2024, 0, 1 + i));
}
