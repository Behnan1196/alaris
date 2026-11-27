import { DOMAINS, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { Suspense } from "react";
import { DomainTag } from "@/components/domain-tag";
import { Card, PageBody, PageHeader, Loading } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { loadThreads, type ThreadSummary } from "@/lib/messages";
import { loadWeek, pct } from "@/lib/tracking";
import { Chat } from "./chat";

const timeFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Son mesaj danışandansa yanıt bekliyor sayılır. */
const awaitingReply = (th: ThreadSummary, coachId: string) => !!th.last && th.last.sender_id !== coachId;

async function Content({ searchParams }: { searchParams: PageProps<"/panel/mesajlar">["searchParams"] }) {
  const { t, f } = await searchParams;
  const filter = f === "bekleyen" ? "bekleyen" : "tumu";
  const { supabase, userId } = await requireCoach();
  const threads = await loadThreads(supabase, userId);
  const waiting = threads.filter((th) => awaitingReply(th, userId));
  const shown = filter === "bekleyen" ? waiting : threads;
  const selectedId = typeof t === "string" ? t : shown[0]?.id;
  const selected = threads.find((x) => x.id === selectedId);

  const [{ data: messages }, { data: coaching }] = selected
    ? await Promise.all([
        supabase
          .from("messages")
          .select("id, sender_id, body, created_at, read_at")
          .eq("thread_id", selected.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("coachings")
          .select("id, coaching_domains(domain_key), programs(name, status, domain_key)")
          .eq("coach_id", userId)
          .eq("client_id", selected.clientId)
          .neq("status", "ended")
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];
  const week = coaching ? (await loadWeek(supabase, [coaching.id])).get(coaching.id) : undefined;
  const href = (params: Record<string, string | undefined>) =>
    `/panel/mesajlar?${new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])}`;

  return (
    <PageBody wide>
      <PageHeader crumb={`${threads.reduce((n, th) => n + th.unread, 0)} okunmamış`} title="Mesajlar" />
      {threads.length === 0 ? (
        <p className="text-sm text-muted">Henüz sohbet yok. Danışan davet koduyla bağlanınca sohbet açılır.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px]">
          <div className="flex flex-col gap-3">
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1 text-sm">
              {[
                ["tumu", `Tümü ${threads.length}`],
                ["bekleyen", `Yanıt bekleyen ${waiting.length}`],
              ].map(([k, label]) => (
                <Link
                  key={k}
                  href={href({ f: k === "tumu" ? undefined : k, t: selected?.id })}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-center font-medium ${filter === k ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <ul className="flex flex-col gap-1">
              {shown.length === 0 && <li className="px-1 text-sm text-muted">Yanıt bekleyen sohbet yok.</li>}
              {shown.map((th) => (
                <li key={th.id}>
                  <Link
                    href={href({ f: filter === "tumu" ? undefined : filter, t: th.id })}
                    className={`flex flex-col rounded-xl border border-line px-3 py-2.5 text-sm ${
                      th.id === selected?.id ? "bg-ink text-white" : "bg-surface hover:bg-soft"
                    }`}
                  >
                    <span className="flex items-center justify-between font-medium">
                      {th.otherName}
                      {th.unread > 0 ? (
                        <span className="rounded-full bg-accent px-1.5 text-xs text-white">{th.unread}</span>
                      ) : awaitingReply(th, userId) ? (
                        <span className={`text-xs ${th.id === selected?.id ? "text-white/70" : "text-accent"}`}>yanıt bekliyor</span>
                      ) : null}
                    </span>
                    <span className={`truncate text-xs ${th.id === selected?.id ? "text-white/70" : "text-muted"}`}>
                      {th.last ? `${timeFmt.format(new Date(th.last.created_at))} · ${th.last.body}` : "Henüz mesaj yok"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {selected && (
            <Chat key={selected.id} threadId={selected.id} me={userId} otherName={selected.otherName} initial={(messages ?? []).reverse()} />
          )}
          {selected && coaching && (
            <aside className="hidden flex-col gap-4 xl:flex">
              <Card title={selected.otherName}>
                <div className="flex flex-wrap gap-1">
                  {coaching.coaching_domains.map(({ domain_key }) => (
                    <DomainTag key={domain_key} k={domain_key} />
                  ))}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Bu hafta uyum</dt>
                    <dd className="font-display text-xl font-semibold">{pct(week?.adherence ?? null)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Kaçırılan</dt>
                    <dd className={`font-display text-xl font-semibold ${week?.missed ? "text-red-700" : ""}`}>{week?.missed ?? 0}</dd>
                  </div>
                </dl>
                <ul className="mt-4 flex flex-col gap-1.5 text-sm">
                  {coaching.coaching_domains.map(({ domain_key }) => {
                    const p = coaching.programs.find((x) => x.domain_key === domain_key && x.status === "active");
                    return (
                      <li key={domain_key} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DOMAINS[domain_key as DomainKey]?.color }} />
                        <span className={p ? "" : "text-muted"}>{p?.name ?? "Program yok"}</span>
                      </li>
                    );
                  })}
                </ul>
                <Link href={`/panel/danisan/${coaching.id}`} className="mt-4 block text-sm font-medium underline">
                  Profili aç
                </Link>
              </Card>
              {!!week?.tasks.length && (
                <Card title="Bugün ve yarın">
                  <ul className="flex flex-col gap-2 text-sm">
                    {week.tasks
                      .filter((x) => {
                        const d = new Date(x.date + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime();
                        return d >= 0 && d <= 86_400_000;
                      })
                      .map((x) => (
                        <li key={x.programTaskId + x.date} className="flex items-center justify-between gap-2">
                          <span>{x.title}</span>
                          <span className="text-xs text-muted">{x.status === "done" ? "✓ Tamam" : x.status === "in_progress" ? "Devam ediyor" : "Bekliyor"}</span>
                        </li>
                      ))}
                  </ul>
                </Card>
              )}
            </aside>
          )}
        </div>
      )}
    </PageBody>
  );
}

export default function Page({ searchParams }: PageProps<"/panel/mesajlar">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
