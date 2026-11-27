import { DOMAINS, type DomainKey } from "@alaris/shared";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { Suspense } from "react";
import { ClientSearch } from "@/components/sidebar";
import { Card, PageBody, PageHeader, Loading } from "@/components/ui";
import { requireCoach } from "@/lib/coach";

/** Program oluşturucuya giriş: danışan ve alan seçimi. */
async function Content() {
  const { supabase, userId } = await requireCoach();
  const { t } = await getT();
  const { data: coachings } = await supabase
    .from("coachings")
    .select("id, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key), programs(name, status, domain_key, updated_at)")
    .eq("coach_id", userId)
    .neq("status", "ended")
    .order("started_at", { ascending: false });

  return (
    <PageBody>
      <PageHeader crumb={t("nav.builder")} title={t("web.builderPick.title")} actions={<ClientSearch />} />
      <Card title={t("web.builderPick.card")}>
        {!coachings?.length ? (
          <p className="text-sm text-muted">
            {t("web.builderPick.inviteFirst")}{" "}
            <Link href="/panel/danisanlar" className="underline">
              {t("nav.clients")}
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line-soft">
            {coachings.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-48 font-medium">{c.client?.full_name || t("common.unnamed")}</span>
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
                        <span className="font-medium">{t(`domain.${domain_key as DomainKey}`)}</span>
                        <span className="text-muted">{p ? `${p.name} · ${t(p.status === "active" ? "programStatus.active" : "programStatus.draft")}` : t("nav.createProgram")}</span>
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
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}
