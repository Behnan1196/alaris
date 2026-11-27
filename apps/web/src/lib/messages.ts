import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ThreadSummary = {
  id: string;
  clientId: string;
  otherName: string;
  unread: number;
  last: { body: string; created_at: string; sender_id: string } | null;
};

/** Koçun sohbetleri: son mesaj ve okunmamış sayısıyla, en yeni önce. */
export async function loadThreads(supabase: Supabase, coachId: string): Promise<ThreadSummary[]> {
  const { data: threads } = await supabase
    .from("threads")
    .select("id, client_id, client:profiles!threads_client_id_fkey(full_name)")
    .eq("coach_id", coachId);
  if (!threads?.length) return [];

  const ids = threads.map((t) => t.id);
  const [{ data: recent }, { data: unread }] = await Promise.all([
    supabase
      .from("messages")
      .select("thread_id, body, created_at, sender_id")
      .in("thread_id", ids)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("messages")
      .select("thread_id")
      .in("thread_id", ids)
      .is("read_at", null)
      .neq("sender_id", coachId),
  ]);

  const lastOf = new Map<string, ThreadSummary["last"]>();
  for (const m of recent ?? []) if (!lastOf.has(m.thread_id)) lastOf.set(m.thread_id, m);
  const unreadOf = new Map<string, number>();
  for (const m of unread ?? []) unreadOf.set(m.thread_id, (unreadOf.get(m.thread_id) ?? 0) + 1);

  return threads
    .map((t) => ({
      id: t.id,
      clientId: t.client_id,
      otherName: t.client?.full_name || "–",
      unread: unreadOf.get(t.id) ?? 0,
      last: lastOf.get(t.id) ?? null,
    }))
    .sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
}
