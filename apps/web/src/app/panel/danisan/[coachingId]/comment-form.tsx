"use client";

import { useState, useTransition } from "react";
import { saveProgressComment } from "@/app/panel/program-actions";

/** Danışanın İlerleme ekranında görünen, alan başına koç yorumu. */
export function CommentForm({ coachingId, domain, initial }: { coachingId: string; domain: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted" htmlFor={`c-${domain}`}>
        Danışana ilerleme yorumun (İlerleme ekranında görür)
      </label>
      <textarea
        id={`c-${domain}`}
        className="min-h-16 w-full rounded-lg border border-line p-2 text-sm outline-none focus:border-ink"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          disabled={pending || body === saved}
          onClick={() =>
            start(async () => {
              const r = await saveProgressComment(coachingId, domain, body);
              if (r.error) setError(r.error);
              else {
                setError(null);
                setSaved(body);
              }
            })
          }
          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium disabled:opacity-40"
        >
          {pending ? "Kaydediliyor…" : body === saved ? "Kaydedildi" : "Yorumu kaydet"}
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </div>
  );
}
