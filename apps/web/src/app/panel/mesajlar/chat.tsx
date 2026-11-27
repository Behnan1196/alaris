"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

const timeFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function Chat({
  threadId,
  me,
  otherName,
  initial,
}: {
  threadId: string;
  me: string;
  otherName: string;
  initial: ChatMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const [supabase] = useState(createClient);

  useEffect(() => {
    supabase.rpc("mark_thread_read", { p_thread_id: threadId }).then(() => router.refresh());
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          if (!m?.id) return;
          setMessages((prev) => {
            const i = prev.findIndex((x) => x.id === m.id);
            if (i >= 0) return prev.map((x) => (x.id === m.id ? { ...x, ...m } : x));
            return [...prev, m];
          });
          if (payload.eventType === "INSERT" && m.sender_id !== me) {
            supabase.rpc("mark_thread_read", { p_thread_id: threadId });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, threadId, me, router]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const { data, error } = await supabase
      .from("messages")
      .insert({ thread_id: threadId, sender_id: me, body })
      .select("id, sender_id, body, created_at, read_at")
      .single();
    setSending(false);
    if (error) return setError(error.message);
    setText("");
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-line bg-white">
      <div className="border-b border-line px-4 py-3 font-semibold">{otherName}</div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm text-muted">Henüz mesaj yok. İlk mesajı sen yaz.</p>}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-ink text-white" : "bg-soft"
                }`}
              >
                {m.body}
              </div>
              <span className="mt-0.5 text-[10px] text-muted">
                {timeFmt.format(new Date(m.created_at))}
                {mine && (m.read_at ? " · Okundu" : " · Gönderildi")}
              </span>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {error && <p className="px-4 text-sm text-red-700">{error}</p>}
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          className="flex-1 resize-none rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
          rows={2}
          placeholder="Mesaj yaz… (Enter gönderir, Shift+Enter yeni satır)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          disabled={sending || !text.trim()}
          className="rounded-lg bg-ink px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}
