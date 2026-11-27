"use client";

import type { MessageKey } from "@alaris/shared";
import { useI18n } from "./i18n";

/** Sunucu bileşenlerinde çeviri metni basmak için: <T k="..." />. */
export function T({ k, vars }: { k: MessageKey; vars?: Record<string, string | number> }) {
  const { t } = useI18n();
  return <>{t(k, vars)}</>;
}
