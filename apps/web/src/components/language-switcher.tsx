"use client";

import { LOCALES, LOCALE_NAMES } from "@alaris/shared";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/i18n-actions";
import { useI18n } from "./i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`} aria-label={t("common.language")}>
      {LOCALES.map((l) => (
        <button
          key={l}
          disabled={pending || l === locale}
          onClick={() =>
            start(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={`rounded-md px-2 py-1 ${l === locale ? "bg-ink text-white" : "text-muted hover:bg-soft hover:text-ink"}`}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
