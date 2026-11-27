import { DOMAINS, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { Suspense } from "react";
import { ClientSearch } from "@/components/sidebar";
import { Card, PageBody, PageHeader } from "@/components/ui";
import { requireCoach } from "@/lib/coach";

const STATUS: Record<string, string> = { draft: "Taslak", active: "Aktif" };

/** Program oluşturucuya giriş: danışan ve alan seçimi. */
async function Content() {
  const { supabase, userId } = await requireCoach();
  const { data: coachings } = await supabase
    .from("coachings")
    .select("id, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key), programs(name, status, domain_key, updated_at)")
    .eq("coach_id", userId)
    .neq("status", "ended")
    .order("started_at", { ascending: false });

  return (
    <PageBody>
      <PageHeader crumb="Program oluşturucu" title="Kimin programı?" actions={<ClientSearch />} />
      <Card title="Danışan ve alan seç">
        {!coachings?.length ? (
          <p className="text-sm text-muted">
            Önce bir danışan davet et: <Link href="/panel/danisanlar" className="underline">Danışanlar</Link>.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line-soft">
            {coachings.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-48 font-medium">{c.client?.full_name || "İsimsiz"}</span>
                <div className="flex flex-wrap gap-2">
                  {c.coaching_domains.map(({ domain_key }) => {
                    const d = DOMAINS[domain_key as DomainKey];
                    const p =
                      c.programs.find((x) => x.domain_key === domain_key && x.status === "active") ??
                      c.programs.find((x) => x.domain_key === domain_key && x.status === "draft");
                    return (
                      <Link
                        key={domain_key}
                        href={`/panel/danisan/${c.id}/program/${domain_key}`}
                        className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm hover:bg-soft"
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d?.color }} />
                        <span className="font-medium">{d?.name}</span>
                        <span className="text-muted">{p ? `${p.name} · ${STATUS[p.status]}` : "Program oluştur"}</span>
                      </Link>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageBody>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-muted">Yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
