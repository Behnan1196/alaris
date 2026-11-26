/* eslint-disable @next/next/no-img-element -- imzalı, süreli bağlantılar; next/image önbelleği uygun değil */
import { Card } from "@/components/ui";

const KIND: Record<string, string> = { meal: "Öğün", front: "Önden", side: "Yandan", other: "Fotoğraf" };
const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

export function Photos({
  photos,
}: {
  photos: { id: string; kind: string; url: string | null; taken_on: string; meta: unknown }[];
}) {
  return (
    <Card title="Fotoğraflar">
      {photos.length === 0 ? (
        <p className="text-sm text-zinc-500">Danışan henüz fotoğraf eklemedi.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p) => {
            const meal = (p.meta as { meal_name?: string } | null)?.meal_name;
            return (
              <a key={p.id} href={p.url ?? "#"} target="_blank" rel="noreferrer" className="flex flex-col gap-1">
                {p.url ? (
                  <img src={p.url} alt={KIND[p.kind]} className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <div className="aspect-square w-full rounded-lg bg-zinc-100" />
                )}
                <span className="text-xs text-zinc-500">
                  {KIND[p.kind]}
                  {meal ? ` · ${meal}` : ""} · {dateFmt.format(new Date(p.taken_on))}
                </span>
              </a>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-zinc-500">Bağlantılar bir saat geçerlidir.</p>
    </Card>
  );
}
