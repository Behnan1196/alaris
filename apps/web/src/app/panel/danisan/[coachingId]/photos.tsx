"use client";

/* eslint-disable @next/next/no-img-element -- imzalı, süreli bağlantılar; next/image önbelleği uygun değil */
import type { MessageKey } from "@alaris/shared";
import { useI18n } from "@/components/i18n";
import { Card } from "@/components/ui";

const KIND: Record<string, MessageKey> = { meal: "photo.meal", front: "photo.front", side: "photo.side", other: "photo.other" };

export function Photos({
  photos,
}: {
  photos: { id: string; kind: string; url: string | null; taken_on: string; meta: unknown }[];
}) {
  const { t, intl } = useI18n();
  const dateFmt = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" });
  return (
    <Card title={t("web.photos.title")}>
      {photos.length === 0 ? (
        <p className="text-sm text-muted">{t("web.photos.empty")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p) => {
            const meal = (p.meta as { meal_name?: string } | null)?.meal_name;
            return (
              <a key={p.id} href={p.url ?? "#"} target="_blank" rel="noreferrer" className="flex flex-col gap-1">
                {p.url ? (
                  <img src={p.url} alt={t(KIND[p.kind] ?? "photo.other")} className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <div className="aspect-square w-full rounded-lg bg-soft" />
                )}
                <span className="text-xs text-muted">
                  {t(KIND[p.kind] ?? "photo.other")}
                  {meal ? ` · ${meal}` : ""} · {dateFmt.format(new Date(p.taken_on))}
                </span>
              </a>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">{t("web.photos.expiry")}</p>
    </Card>
  );
}
