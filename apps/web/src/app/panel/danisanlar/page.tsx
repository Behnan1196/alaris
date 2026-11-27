import { DOMAINS, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { Suspense } from "react";
import { DomainTag } from "@/components/domain-tag";
import { TopActions } from "@/components/sidebar";
import { Card, PageBody, PageHeader } from "@/components/ui";
import { FLAG_LABELS, FLAG_ORDER, loadClientRows, type ClientFlag, type ClientRow } from "@/lib/clients";
import { requireCoach } from "@/lib/coach";
import { pct } from "@/lib/tracking";
import { InviteForm } from "../invite-form";

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
const rtf = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

const VIEWS: { key: "all" | ClientFlag; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "attention", label: FLAG_LABELS.attention },
  { key: "message", label: FLAG_LABELS.message },
  { key: "no_program", label: FLAG_LABELS.no_program },
  { key: "ending", label: FLAG_LABELS.ending },
  { key: "inactive", label: FLAG_LABELS.inactive },
];

const FLAG_STYLE: Record<ClientFlag | "ok", string> = {
  message: "bg-accent-soft text-accent",
  attention: "bg-red-50 text-red-800",
  no_program: "bg-amber-50 text-amber-900",
  ending: "bg-sky-50 text-sky-900",
  inactive: "bg-soft text-ink-2",
  ok: "bg-emerald-50 text-emerald-800",
};

function relative(iso: string | null) {
  if (!iso) return "–";
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days === 0) {
    const hours = Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000);
    return hours === 0 ? "az önce" : rtf.format(hours, "hour");
  }
  return rtf.format(days, "day");
}

/** Son 4 haftanın uyum eğilimi (küçük çubuklar). */
function Trend({ values }: { values: (number | null)[] }) {
  return (
    <span className="flex h-6 items-end gap-0.5" aria-label="Son 4 hafta uyum">
      {values.map((v, i) => (
        <span
          key={i}
          title={v === null ? "veri yok" : `%${Math.round(v * 100)}`}
          className={`w-1.5 rounded-sm ${v === null ? "bg-line" : v >= 0.8 ? "bg-emerald-600" : v >= 0.5 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ height: `${v === null ? 3 : Math.max(3, Math.round(v * 24))}px` }}
        />
      ))}
    </span>
  );
}

function StatusChip({ row }: { row: ClientRow }) {
  if (row.status === "ended") return <span className="text-xs text-muted">Koçluk bitti</span>;
  const top = FLAG_ORDER.find((f) => row.flags.includes(f)) ?? "ok";
  const extra = row.flags.length > 1 ? ` +${row.flags.length - 1}` : "";
  return (
    <span
      title={row.flags.map((f) => FLAG_LABELS[f]).join(", ") || FLAG_LABELS.ok}
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${FLAG_STYLE[top]}`}
    >
      {FLAG_LABELS[top]}
      {top === "message" && row.unread > 1 ? ` (${row.unread})` : ""}
      {extra}
    </span>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/panel/danisanlar">["searchParams"] }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const view = (typeof params.v === "string" ? params.v : "all") as "all" | ClientFlag;
  const { supabase, userId, domainKeys } = await requireCoach();

  const [rows, { data: invites }] = await Promise.all([
    loadClientRows(supabase, userId),
    supabase
      .from("invites")
      .select("id, code, domain_keys, expires_at")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const q = query.toLocaleLowerCase("tr");
  const searched = rows.filter((r) => !q || r.name.toLocaleLowerCase("tr").includes(q));
  const count = (k: "all" | ClientFlag) => (k === "all" ? searched.length : searched.filter((r) => r.flags.includes(k)).length);
  const list = view === "all" ? searched : searched.filter((r) => r.flags.includes(view));
  const href = (v: string) => `/panel/danisanlar?${new URLSearchParams({ ...(v !== "all" ? { v } : {}), ...(query ? { q: query } : {}) })}`;

  return (
    <PageBody>
      <PageHeader crumb={`${rows.filter((r) => r.status === "active").length} aktif danışan`} title="Danışanlar" actions={<TopActions />} />

      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => {
          const on = view === v.key;
          return (
            <Link
              key={v.key}
              href={href(v.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
                on ? "border-ink bg-ink text-white" : "border-line bg-surface hover:bg-soft"
              }`}
            >
              {v.label}
              <span className={on ? "text-white/70" : "text-muted"}>{count(v.key)}</span>
            </Link>
          );
        })}
        {query && (
          <Link href={href(view).replace(/([?&])q=[^&]*/, "$1")} className="text-sm text-muted underline">
            “{query}” aramasını temizle
          </Link>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="overflow-x-auto rounded-2xl border border-line bg-surface">
          {!list.length ? (
            <p className="p-5 text-sm text-muted">
              {rows.length === 0
                ? "Henüz danışanın yok. Sağdan bir davet kodu oluşturup danışanınla paylaş."
                : "Bu görünümde danışan yok."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Danışan</th>
                  <th className="px-3 py-3 font-medium">Alanlar</th>
                  <th className="px-3 py-3 font-medium">Hafta</th>
                  <th className="px-3 py-3 font-medium">Uyum</th>
                  <th className="px-3 py-3 font-medium">Son etkinlik</th>
                  <th className="px-5 py-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-line-soft hover:bg-page">
                    <td className="px-5 py-3">
                      <Link href={`/panel/danisan/${r.id}`} className="font-medium hover:underline">
                        {r.name}
                      </Link>
                      <span className="block text-xs text-muted">{dateFmt.format(new Date(r.startedAt))} tarihinden beri</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.domains.map((d) => (
                          <DomainTag key={d} k={d} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {r.weeks.length
                        ? r.weeks.map((w) => (
                            <span key={w.domain} className="block whitespace-nowrap">
                              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: DOMAINS[w.domain as DomainKey]?.color }} />
                              {w.week} / {w.total}
                            </span>
                          ))
                        : "–"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Trend values={r.trend} />
                        <span className="whitespace-nowrap text-xs text-muted">
                          {pct(r.adherence)}
                          {r.planned ? ` · ${r.done}/${r.planned}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">{relative(r.lastActivity)}</td>
                    <td className="px-5 py-3">
                      <StatusChip row={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

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
      <p className="text-xs text-muted">
        Dikkat: bu hafta kaçırılan görev ya da %50 altı uyum. Etkinlik yok: 5 günden uzun süredir kayıt yok. Program bitiyor: 7 gün içinde.
      </p>
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
