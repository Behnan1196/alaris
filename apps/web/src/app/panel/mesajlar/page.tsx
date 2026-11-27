import Link from "next/link";
import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { loadThreads } from "@/lib/messages";
import { Chat } from "./chat";

const timeFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function Content({ searchParams }: { searchParams: PageProps<"/panel/mesajlar">["searchParams"] }) {
  const { t } = await searchParams;
  const { supabase, userId } = await requireCoach();
  const threads = await loadThreads(supabase, userId);
  const selectedId = typeof t === "string" ? t : threads[0]?.id;
  const selected = threads.find((x) => x.id === selectedId);

  const { data: messages } = selected
    ? await supabase
        .from("messages")
        .select("id, sender_id, body, created_at, read_at")
        .eq("thread_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  return (
    <PageBody>
      <PageHeader crumb={`${threads.reduce((n, t) => n + t.unread, 0)} okunmamış`} title="Mesajlar" />
      {threads.length === 0 ? (
        <p className="text-sm text-muted">Henüz sohbet yok. Danışan davet koduyla bağlanınca sohbet açılır.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <ul className="flex flex-col gap-1">
            {threads.map((th) => (
              <li key={th.id}>
                <Link
                  href={`/panel/mesajlar?t=${th.id}`}
                  className={`flex flex-col rounded-xl border border-line px-3 py-2.5 text-sm ${
                    th.id === selected?.id ? "bg-ink text-white" : "bg-surface hover:bg-soft"
                  }`}
                >
                  <span className="flex items-center justify-between font-medium">
                    {th.otherName}
                    {th.unread > 0 && (
                      <span className="rounded-full bg-red-600 px-1.5 text-xs text-white">{th.unread}</span>
                    )}
                  </span>
                  <span className={`truncate text-xs ${th.id === selected?.id ? "text-line" : "text-muted"}`}>
                    {th.last ? `${timeFmt.format(new Date(th.last.created_at))} · ${th.last.body}` : "Henüz mesaj yok"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {selected && (
            <Chat
              key={selected.id}
              threadId={selected.id}
              me={userId}
              otherName={selected.otherName}
              initial={(messages ?? []).reverse()}
            />
          )}
        </div>
      )}
    </PageBody>
  );
}

export default function Page({ searchParams }: PageProps<"/panel/mesajlar">) {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-muted">Yükleniyor…</p>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
