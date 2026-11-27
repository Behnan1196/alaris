"use client";

import { DOMAINS, type DomainKey } from "@alaris/shared";
import { useI18n } from "./i18n";

export function DomainTag({ k }: { k: string }) {
  const { t } = useI18n();
  const d = DOMAINS[k as DomainKey];
  if (!d) return null;
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: d.color }}>
      {t(`domain.${d.key}`)}
    </span>
  );
}
