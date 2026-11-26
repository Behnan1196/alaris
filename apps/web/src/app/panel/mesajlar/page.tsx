import Link from "next/link";
import { Suspense } from "react";
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/panel" className="text-sm text-zinc-500 underline">
          ← Genel bakış
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Mesajlar</h1>
      </div>
      {threads.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz sohbet yok. Danışan davet koduyla bağlanınca sohbet açılır.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <ul className="flex flex-col gap-1">
            {threads.map((th) => (
              <li key={th.id}>
                <Link
                  href={`/panel/mesajlar?t=${th.id}`}
                  className={`flex flex-col rounded-lg px-3 py-2 text-sm ${
                    th.id === selected?.id ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
                  }`}
                >
                  <span className="flex items-center justify-between font-medium">
                    {th.otherName}
                    {th.unread > 0 && (
                      <span className="rounded-full bg-red-600 px-1.5 text-xs text-white">{th.unread}</span>
                    )}
                  </span>
                  <span className={`truncate text-xs ${th.id === selected?.id ? "text-zinc-300" : "text-zinc-500"}`}>
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
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/panel/mesajlar">) {
  return (
    <main className="flex-1 bg-zinc-50">
      <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Yükleniyor…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
