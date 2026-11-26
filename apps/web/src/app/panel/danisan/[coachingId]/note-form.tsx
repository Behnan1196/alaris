"use client";

import { useState, useTransition } from "react";
import { saveNote } from "@/app/panel/program-actions";

export function NoteForm({ coachingId, initial }: { coachingId: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="min-h-28 w-full rounded-lg border border-zinc-300 p-2 text-sm outline-none focus:border-zinc-900"
        placeholder="Sakatlık geçmişi, tercihleri, hedefleri… Danışan bu notu görmez."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          disabled={pending || body === saved}
          onClick={() =>
            start(async () => {
              const res = await saveNote(coachingId, body);
              if (res.error) setError(res.error);
              else {
                setError(null);
                setSaved(body);
              }
            })
          }
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "Kaydediliyor…" : body === saved ? "Kaydedildi" : "Notu kaydet"}
        </button>
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
