"use client";

import { useState, useTransition } from "react";
import { saveNote } from "@/app/panel/program-actions";
import { useI18n } from "@/components/i18n";

export function NoteForm({ coachingId, initial }: { coachingId: string; initial: string }) {
  const { t } = useI18n();
  const [body, setBody] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="min-h-28 w-full rounded-lg border border-line p-2 text-sm outline-none focus:border-ink"
        placeholder={t("web.note.placeholder")}
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
          className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? t("common.saving") : body === saved ? t("common.saved") : t("web.note.save")}
        </button>
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
