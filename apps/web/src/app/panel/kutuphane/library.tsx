"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Exercise = {
  id: string;
  owner_coach_id: string | null;
  name: string;
  muscles: string[];
  equipment: string | null;
  steps: string[];
  video_paths: Record<string, string>;
  videoUrl?: string | null;
};

type Draft = { id?: string; name: string; muscles: string; equipment: string; steps: string; video_path: string | null };

const input = "w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-ink";
const MAX_VIDEO_MB = 50;

export function Library({ coachId, exercises }: { coachId: string; exercises: Exercise[] }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const open = (e?: Exercise, copy = false) => {
    setError(null);
    setFile(null);
    setDraft(
      e
        ? {
            id: copy ? undefined : e.id,
            name: e.name,
            muscles: e.muscles.join(", "),
            equipment: e.equipment ?? "",
            steps: e.steps.join("\n"),
            video_path: copy ? null : (e.video_paths?.front ?? null),
          }
        : { name: "", muscles: "", equipment: "", steps: "", video_path: null },
    );
  };

  async function save() {
    if (!draft?.name.trim()) return setError("Hareketin adını yaz.");
    setBusy(true);
    setError(null);
    try {
      let videoPath = draft.video_path;
      if (file) {
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`Video en fazla ${MAX_VIDEO_MB} MB olabilir.`);
        const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
        const path = `exercises/${coachId}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("media").upload(path, file, { contentType: file.type || "video/mp4" });
        if (up.error) throw up.error;
        if (draft.video_path) await supabase.storage.from("media").remove([draft.video_path]);
        videoPath = path;
      }
      const row = {
        owner_coach_id: coachId,
        name: draft.name.trim(),
        muscles: draft.muscles.split(",").map((m) => m.trim()).filter(Boolean),
        equipment: draft.equipment.trim() || null,
        steps: draft.steps.split("\n").map((s) => s.trim()).filter(Boolean),
        video_paths: videoPath ? { front: videoPath } : {},
      };
      const res = draft.id
        ? await supabase.from("exercises").update(row).eq("id", draft.id)
        : await supabase.from("exercises").insert(row);
      if (res.error) throw res.error;
      setDraft(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: Exercise) {
    if (!confirm(`"${e.name}" kütüphanenden silinsin mi?`)) return;
    const paths = Object.values(e.video_paths ?? {});
    const res = await supabase.from("exercises").delete().eq("id", e.id);
    if (res.error) return setError(res.error.message);
    if (paths.length) await supabase.storage.from("media").remove(paths);
    router.refresh();
  }

  const list = exercises.filter((e) => e.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input className={input} placeholder="Hareket ara" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={() => open()} className="shrink-0 rounded-lg bg-ink px-3 text-sm font-medium text-white">
            + Yeni hareket
          </button>
        </div>
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-white">
          {list.map((e) => {
            const mine = e.owner_coach_id === coachId;
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium">
                    {e.name}
                    {Object.keys(e.video_paths ?? {}).length > 0 && (
                      <span className="ml-2 rounded bg-soft px-1.5 py-0.5 text-xs text-muted">video</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {[e.muscles.join(", "), e.equipment, mine ? "Senin" : "Sistem"].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {mine ? (
                  <>
                    <button onClick={() => open(e)} className="text-xs underline">Düzenle</button>
                    <button onClick={() => remove(e)} className="text-xs text-red-600 underline">Sil</button>
                  </>
                ) : (
                  <button onClick={() => open(e, true)} className="text-xs underline">Kopyala ve düzenle</button>
                )}
              </li>
            );
          })}
          {list.length === 0 && <li className="px-4 py-3 text-sm text-muted">Sonuç yok.</li>}
        </ul>
      </div>

      {draft && (
        <div className="flex flex-col gap-3 self-start rounded-xl border border-line bg-white p-4 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {draft.id ? "Hareketi düzenle" : "Yeni hareket"}
          </p>
          <label className="text-xs font-medium text-muted">
            Ad
            <input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            Çalışan kaslar (virgülle)
            <input className={input} placeholder="göğüs, triceps" value={draft.muscles}
              onChange={(e) => setDraft({ ...draft, muscles: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            Ekipman
            <input className={input} placeholder="Dambıl" value={draft.equipment}
              onChange={(e) => setDraft({ ...draft, equipment: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            Nasıl yapılır (her satır bir adım)
            <textarea className={input} rows={4} value={draft.steps} onChange={(e) => setDraft({ ...draft, steps: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            Video (MP4/MOV, en fazla {MAX_VIDEO_MB} MB, sessiz ve döngüde oynatılır)
            <input type="file" accept="video/mp4,video/quicktime" className="mt-1 block text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {draft.video_path && !file && <span className="text-muted">Kayıtlı bir video var; yenisini seçersen değişir.</span>}
          </label>
          {error && <p className="rounded bg-red-50 px-2 py-1 text-sm text-red-800">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} onClick={save} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {busy ? (file ? "Video yükleniyor…" : "Kaydediliyor…") : "Kaydet"}
            </button>
            <button onClick={() => setDraft(null)} className="text-sm underline">Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}
