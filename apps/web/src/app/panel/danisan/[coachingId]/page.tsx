import { DOMAINS, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui";
import { requireCoach } from "@/lib/coach";

const PROGRAM_STATUS: Record<string, string> = {
  draft: "Taslak",
  active: "Aktif",
  completed: "Tamamlandı",
  archived: "Arşiv",
};

async function Content({ params }: { params: PageProps<"/panel/danisan/[coachingId]">["params"] }) {
  const { coachingId } = await params;
  const { supabase, userId } = await requireCoach();

  const { data: coaching } = await supabase
    .from("coachings")
    .select(
      "id, status, started_at, client_id, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key), programs(id, name, status, domain_key, start_date, weeks, updated_at)",
    )
    .eq("id", coachingId)
    .eq("coach_id", userId)
    .maybeSingle();
  if (!coaching) notFound();

  const { data: otherDomains } = await supabase.rpc("client_other_domains", {
    p_client_id: coaching.client_id,
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/panel" className="text-sm text-zinc-500 underline">
          ← Danışanlar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {coaching.client?.full_name || "İsimsiz danışan"}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {coaching.coaching_domains.map(({ domain_key }) => {
          const d = DOMAINS[domain_key as DomainKey];
          const programs = coaching.programs
            .filter((p) => p.domain_key === domain_key && p.status !== "archived")
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
          const current = programs.find((p) => p.status === "active") ?? programs.find((p) => p.status === "draft");
          return (
            <section key={domain_key} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d?.color }} />
                <h2 className="font-semibold">{d?.name ?? domain_key}</h2>
              </div>
              {current ? (
                <p className="mt-3 text-sm">
                  <span className="font-medium">{current.name}</span>
                  <span className="text-zinc-500"> · {PROGRAM_STATUS[current.status]}</span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">Bu alanda henüz program yok.</p>
              )}
              <Link
                href={`/panel/danisan/${coaching.id}/program/${domain_key}`}
                className="mt-4 inline-block rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
              >
                {current ? "Programı düzenle" : "Program oluştur"}
              </Link>
            </section>
          );
        })}
      </div>

      <Card title="Başka koçlardan aldığı">
        {otherDomains?.length ? (
          <div className="flex gap-2">
            {otherDomains.map(({ domain_key }) => (
              <span key={domain_key} className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                {DOMAINS[domain_key as DomainKey]?.name ?? domain_key}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Başka bir koçtan hizmet almıyor.</p>
        )}
        <p className="mt-3 text-xs text-zinc-500">Ayrıntıları yalnızca danışan izin verirse görebilirsin.</p>
      </Card>
    </div>
  );
}

export default function Page({ params }: PageProps<"/panel/danisan/[coachingId]">) {
  return (
    <main className="flex-1 bg-zinc-50">
      <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Yükleniyor…</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}
