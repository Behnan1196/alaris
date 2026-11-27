import Link from "next/link";
import { Suspense } from "react";
import { DomainTag } from "@/components/domain-tag";
import { TopActions } from "@/components/sidebar";
import { Card, PageBody, PageHeader } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { loadWeek, pct } from "@/lib/tracking";
import { InviteForm } from "../invite-form";

const STATUS_LABELS: Record<string, string> = {
  invited: "Davet edildi",
  active: "Aktif",
  paused: "Duraklatıldı",
  ended: "Bitti",
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });

async function Content({ searchParams }: { searchParams: PageProps<"/panel/danisanlar">["searchParams"] }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().toLocaleLowerCase("tr") : "";
  const { supabase, userId, domainKeys } = await requireCoach();

  const [{ data: coachings }, { data: invites }] = await Promise.all([
    supabase
      .from("coachings")
      .select("id, status, started_at, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key)")
      .eq("coach_id", userId)
      .order("started_at", { ascending: false }),
    supabase
      .from("invites")
      .select("id, code, domain_keys, expires_at")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);
  const list = (coachings ?? []).filter((c) => !query || (c.client?.full_name ?? "").toLocaleLowerCase("tr").includes(query));
  const week = await loadWeek(
    supabase,
    list.filter((c) => c.status !== "ended").map((c) => c.id),
  );

  return (
    <PageBody>
      <PageHeader crumb={`${coachings?.length ?? 0} danışan`} title="Danışanlar" actions={<TopActions />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title={query ? `"${q}" için sonuçlar (${list.length})` : "Tüm danışanlar"}>
          {!list.length ? (
            <p className="text-sm text-muted">
              {query ? "Bu adla danışan bulunamadı." : "Henüz danışanın yok. Sağdan bir davet kodu oluşturup danışanınla paylaş."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-2 font-medium">Danışan</th>
                  <th className="pb-2 font-medium">Alanlar</th>
                  <th className="pb-2 font-medium">Bu hafta uyum</th>
                  <th className="pb-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const w = week.get(c.id);
                  return (
                    <tr key={c.id} className="border-t border-line-soft">
                      <td className="py-3">
                        <Link href={`/panel/danisan/${c.id}`} className="font-medium hover:underline">
                          {c.client?.full_name || "İsimsiz"}
                        </Link>
                        <span className="block text-xs text-muted">{dateFmt.format(new Date(c.started_at))} tarihinden beri</span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {c.coaching_domains.map((d) => (
                            <DomainTag key={d.domain_key} k={d.domain_key} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-muted">
                        {pct(w?.adherence ?? null)}
                        {w?.planned ? ` · ${w.done}/${w.planned}` : ""}
                      </td>
                      <td className="py-3 text-muted">{STATUS_LABELS[c.status]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
        <div className="flex flex-col gap-6">
          <Card title="Danışan davet et">
            <InviteForm domainKeys={domainKeys} />
          </Card>
          {!!invites?.length && (
            <Card title="Kullanılmamış davetler">
              <ul className="flex flex-col gap-3 text-sm">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold tracking-widest">{i.code}</span>
                    <span className="flex gap-1">
                      {i.domain_keys.map((k) => (
                        <DomainTag key={k} k={k} />
                      ))}
                    </span>
                    <span className="text-xs text-muted">{dateFmt.format(new Date(i.expires_at))}e kadar</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </PageBody>
  );
}

export default function Page({ searchParams }: PageProps<"/panel/danisanlar">) {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-muted">Yükleniyor…</p>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
