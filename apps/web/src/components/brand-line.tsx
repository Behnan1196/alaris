"use client";

import { useI18n } from "./i18n";
import { LanguageSwitcher } from "./language-switcher";

/** Giriş/kayıt kartlarının üst satırı: marka ve dil seçici. */
export function BrandLine() {
  const { t } = useI18n();
  return (
    <div className="mb-1 flex items-center justify-between">
      <p className="text-sm font-medium text-muted">{t("web.brand")}</p>
      <LanguageSwitcher />
    </div>
  );
}
