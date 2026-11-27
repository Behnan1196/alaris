"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { localized, localizedName, tagLabel } from "@alaris/shared";
import { useI18n } from "@/components/i18n";
import { createClient } from "@/lib/supabase/client";

export type Exercise = {
  id: string;
  owner_coach_id: string | null;
  name: string;
  name_i18n?: unknown;
  key?: string | null;
  category?: string | null;
  secondary_muscles?: string[];
  steps_i18n?: unknown;
  benefits_i18n?: unknown;
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
  const { t, locale } = useI18n();
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [viewing, setViewing] = useState<Exercise | null>(null);

  const muscleText = (list: string[] = []) => list.map((m) => tagLabel("muscle", m, t)).join(", ");
  const stepsOf = (e: Exercise) => localized<string[]>(e.steps_i18n, locale, e.steps);
  const categories = [...new Set(exercises.map((e) => e.category).filter((c): c is string => !!c))];

  const open = (e?: Exercise, copy = false) => {
    setViewing(null);
    setError(null);
    setFile(null);
    setDraft(
      e
        ? {
            id: copy ? undefined : e.id,
            name: copy ? localizedName(e, locale) : e.name,
            muscles: copy ? muscleText([...e.muscles, ...(e.secondary_muscles ?? [])]) : e.muscles.join(", "),
            equipment: copy && e.equipment ? tagLabel("equipment", e.equipment, t) : (e.equipment ?? ""),
            steps: (copy ? stepsOf(e) : e.steps).join("\n"),
            video_path: copy ? null : (e.video_paths?.front ?? null),
          }
        : { name: "", muscles: "", equipment: "", steps: "", video_path: null },
    );
  };

  async function save() {
    if (!draft?.name.trim()) return setError(t("lib.err.name"));
    setBusy(true);
    setError(null);
    try {
      let videoPath = draft.video_path;
      if (file) {
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(t("lib.err.videoSize", { mb: MAX_VIDEO_MB }));
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
    if (!confirm(t("lib.deleteConfirm", { name: localizedName(e, locale) }))) return;
    const paths = Object.values(e.video_paths ?? {});
    const res = await supabase.from("exercises").delete().eq("id", e.id);
    if (res.error) return setError(res.error.message);
    if (paths.length) await supabase.storage.from("media").remove(paths);
    router.refresh();
  }

  const q = query.toLocaleLowerCase(locale);
  const list = exercises.filter(
    (e) =>
      (cat === "all" || (cat === "mine" ? e.owner_coach_id === coachId : e.category === cat)) &&
      (!q || localizedName(e, locale).toLocaleLowerCase(locale).includes(q) || e.name.toLocaleLowerCase(locale).includes(q) || muscleText(e.muscles).toLocaleLowerCase(locale).includes(q)),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input className={input} placeholder={t("lib.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={() => open()} className="shrink-0 rounded-lg bg-ink px-3 text-sm font-medium text-white">
            {t("lib.new")}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "mine", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${cat === c ? "border-ink bg-ink text-white" : "border-line bg-surface hover:bg-soft"}`}
            >
              {c === "all" ? t("lib.allCategories") : c === "mine" ? t("lib.mine") : tagLabel("exCat", c, t)}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-muted">{t("lib.count", { n: list.length })}</span>
        </div>
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-white">
          {list.map((e) => {
            const mine = e.owner_coach_id === coachId;
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium">
                    {localizedName(e, locale)}
                    {Object.keys(e.video_paths ?? {}).length > 0 && (
                      <span className="ml-2 rounded bg-soft px-1.5 py-0.5 text-xs text-muted">video</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {[muscleText(e.muscles), e.equipment ? tagLabel("equipment", e.equipment, t) : null, e.category ? tagLabel("exCat", e.category, t) : null, mine ? t("lib.yours") : t("lib.system")].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {mine ? (
                  <>
                    <button onClick={() => open(e)} className="text-xs underline">{t("common.edit")}</button>
                    <button onClick={() => remove(e)} className="text-xs text-red-600 underline">{t("common.delete")}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setDraft(null); setViewing(e); }} className="text-xs underline">{t("lib.view")}</button>
                    <button onClick={() => open(e, true)} className="text-xs underline">{t("lib.copyEdit")}</button>
                  </>
                )}
              </li>
            );
          })}
          {list.length === 0 && <li className="px-4 py-3 text-sm text-muted">{t("lib.noResults")}</li>}
        </ul>
      </div>

      {viewing && !draft && (
        <div className="flex flex-col gap-3 self-start rounded-xl border border-line bg-white p-4 text-sm lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                {[viewing.category ? tagLabel("exCat", viewing.category, t) : null, viewing.equipment ? tagLabel("equipment", viewing.equipment, t) : null].filter(Boolean).join(" · ")}
              </p>
              <h3 className="text-lg font-semibold">{localizedName(viewing, locale)}</h3>
            </div>
            <button onClick={() => setViewing(null)} className="text-muted hover:text-ink" aria-label={t("common.close")}>
              ✕
            </button>
          </div>
          <p>
            <span className="font-medium">{t("lib.primary")}:</span> {muscleText(viewing.muscles)}
          </p>
          {!!viewing.secondary_muscles?.length && (
            <p>
              <span className="font-medium">{t("lib.secondary")}:</span> {muscleText(viewing.secondary_muscles)}
            </p>
          )}
          {localized<string>(viewing.benefits_i18n, locale, "") && (
            <div>
              <p className="font-medium">{t("lib.benefits")}</p>
              <p className="text-ink-2">{localized<string>(viewing.benefits_i18n, locale, "")}</p>
            </div>
          )}
          <div>
            <p className="font-medium">{t("m.ex.howTo")}</p>
            <ol className="ml-4 list-decimal text-ink-2">
              {stepsOf(viewing).map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-muted">{t("lib.reviewNote")}</p>
          <button onClick={() => open(viewing, true)} className="self-start rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white">
            {t("lib.copyEdit")}
          </button>
        </div>
      )}

      {draft && (
        <div className="flex flex-col gap-3 self-start rounded-xl border border-line bg-white p-4 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {draft.id ? t("lib.editTitle") : t("lib.newTitle")}
          </p>
          <label className="text-xs font-medium text-muted">
            {t("b.habitName")}
            <input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            {t("lib.muscles")}
            <input className={input} placeholder={t("lib.musclesPh")} value={draft.muscles}
              onChange={(e) => setDraft({ ...draft, muscles: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            {t("lib.equipment")}
            <input className={input} placeholder={t("lib.equipmentPh")} value={draft.equipment}
              onChange={(e) => setDraft({ ...draft, equipment: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            {t("lib.steps")}
            <textarea className={input} rows={4} value={draft.steps} onChange={(e) => setDraft({ ...draft, steps: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-muted">
            {t("lib.video", { mb: MAX_VIDEO_MB })}
            <input type="file" accept="video/mp4,video/quicktime" className="mt-1 block text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {draft.video_path && !file && <span className="text-muted">{t("lib.videoExists")}</span>}
          </label>
          {error && <p className="rounded bg-red-50 px-2 py-1 text-sm text-red-800">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} onClick={save} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {busy ? (file ? t("lib.uploading") : t("common.saving")) : t("common.save")}
            </button>
            <button onClick={() => setDraft(null)} className="text-sm underline">{t("common.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
