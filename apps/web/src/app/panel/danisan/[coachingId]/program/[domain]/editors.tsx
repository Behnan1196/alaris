"use client";

import {
  type Intensity,
  type MealOptions,
  type MealPayload,
  type MeasureMetric,
  type MeasureOptions,
  type MeasurePayload,
  type WorkoutOptions,
  type WorkoutPayload,
} from "@alaris/shared";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n";

export const inputCls =
  "w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-ink";

export function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {text}
      {children}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const num = (v: string) => (v === "" ? null : Number(v));

export function WorkoutEditor({
  payload,
  options,
  onChange,
  exercises,
}: {
  payload: WorkoutPayload;
  options: WorkoutOptions;
  onChange: (p: WorkoutPayload, o: WorkoutOptions) => void;
  exercises: { id: string; name: string }[];
}) {
  const { t } = useI18n();
  const set = (p: Partial<WorkoutPayload>) => onChange({ ...payload, ...p }, options);
  const setEx = (i: number, patch: Partial<WorkoutPayload["exercises"][number]>) =>
    set({ exercises: payload.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Label text={t("e.duration")}>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={payload.duration_min ?? ""}
            onChange={(e) => set({ duration_min: num(e.target.value) })}
          />
        </Label>
        <Label text={t("e.intensity")}>
          <select
            className={inputCls}
            value={payload.intensity}
            onChange={(e) => set({ intensity: e.target.value as Intensity })}
          >
            {(["light", "medium", "high"] as const).map((k) => (
              <option key={k} value={k}>
                {t(`intensity.${k}`)}
              </option>
            ))}
          </select>
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted">{t("e.exercises")}</p>
        <datalist id="exercise-library">
          {exercises.map((e) => (
            <option key={e.id} value={e.name} />
          ))}
        </datalist>
        {payload.exercises.map((e, i) => (
          <div key={i} className={`flex flex-col gap-2 rounded-lg border p-2 ${e.superset ? "-mt-2 border-t-0 border-l-4 border-l-ink border-line" : "border-line"}`}>
            <div className="flex gap-2">
              <input
                className={inputCls}
                list="exercise-library"
                placeholder={t("e.exerciseNamePh")}
                value={e.name}
                onChange={(ev) => {
                  const match = exercises.find((x) => x.name === ev.target.value);
                  setEx(i, { name: ev.target.value, exercise_id: match?.id ?? null });
                }}
              />
              <button
                type="button"
                className="px-2 text-muted hover:text-red-600"
                onClick={() => set({ exercises: payload.exercises.filter((_, j) => j !== i) })}
                aria-label={t("e.removeExercise")}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Label text={t("e.sets")}>
                <input className={inputCls} type="number" min={1} value={e.sets}
                  onChange={(ev) => setEx(i, { sets: Number(ev.target.value) || 1 })} />
              </Label>
              <Label text={t("e.reps")}>
                <input className={inputCls} type="number" min={0} value={e.reps ?? ""}
                  onChange={(ev) => setEx(i, { reps: num(ev.target.value) })} />
              </Label>
              <Label text={t("metric.weight")}>
                <input className={inputCls} type="number" min={0} step="0.5" value={e.weight_kg ?? ""}
                  onChange={(ev) => setEx(i, { weight_kg: num(ev.target.value) })} />
              </Label>
              <Label text={t("e.rest")}>
                <input className={inputCls} type="number" min={0} value={e.rest_sec}
                  onChange={(ev) => setEx(i, { rest_sec: Number(ev.target.value) || 0 })} />
              </Label>
            </div>
            {i > 0 && (
              <Toggle label={t("e.superset")} checked={!!e.superset} onChange={(v) => setEx(i, { superset: v })} />
            )}
            <div className="grid grid-cols-[1fr_3fr] gap-2">
              <Label text={t("e.durationSec")}>
                <input className={inputCls} type="number" min={0} value={e.duration_sec ?? ""}
                  placeholder={t("e.durationSecPh")}
                  onChange={(ev) => setEx(i, { duration_sec: num(ev.target.value) })} />
              </Label>
              <Label text={t("e.note")}>
                <input className={inputCls} value={e.note ?? ""}
                  onChange={(ev) => setEx(i, { note: ev.target.value })} />
              </Label>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="self-start text-sm font-medium text-ink-2 underline"
          onClick={() =>
            set({
              exercises: [
                ...payload.exercises,
                { name: "", sets: 3, reps: 10, weight_kg: null, rest_sec: 90, duration_sec: null, note: "" },
              ],
            })
          }
        >
          {t("e.addExercise")}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Toggle label={t("e.logSets")} checked={options.log_sets}
          onChange={(v) => onChange(payload, { ...options, log_sets: v })} />
        <Toggle label={t("e.autoRest")} checked={options.auto_rest}
          onChange={(v) => onChange(payload, { ...options, auto_rest: v })} />
        <Toggle label={t("e.askRpe")} checked={options.ask_rpe}
          onChange={(v) => onChange(payload, { ...options, ask_rpe: v })} />
      </div>
    </div>
  );
}

export function MealEditor({
  payload,
  options,
  onChange,
}: {
  payload: MealPayload;
  options: MealOptions;
  onChange: (p: MealPayload, o: MealOptions) => void;
}) {
  const { t } = useI18n();
  const set = (p: Partial<MealPayload>) => onChange({ ...payload, ...p }, options);
  const setMeal = (i: number, patch: Partial<MealPayload["meals"][number]>) =>
    set({ meals: payload.meals.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const totalKcal = payload.meals.reduce((s, m) => s + (m.kcal ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        <Label text={t("e.kcalTarget")}>
          <input className={inputCls} type="number" min={0} value={payload.kcal_target ?? ""}
            onChange={(e) => set({ kcal_target: num(e.target.value) })} />
        </Label>
        <Label text="Protein (g)">
          <input className={inputCls} type="number" min={0} value={payload.protein_g ?? ""}
            onChange={(e) => set({ protein_g: num(e.target.value) })} />
        </Label>
        <Label text={t("e.carb")}>
          <input className={inputCls} type="number" min={0} value={payload.carb_g ?? ""}
            onChange={(e) => set({ carb_g: num(e.target.value) })} />
        </Label>
        <Label text={t("e.fat")}>
          <input className={inputCls} type="number" min={0} value={payload.fat_g ?? ""}
            onChange={(e) => set({ fat_g: num(e.target.value) })} />
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted">
          {t("e.meals")} {totalKcal > 0 && <span className="text-muted">· {t("e.totalKcal", { n: totalKcal })}</span>}
        </p>
        {payload.meals.map((m, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-2">
            <div className="grid grid-cols-[80px_1fr_90px_auto] gap-2">
              <input className={inputCls} type="time" value={m.time}
                onChange={(e) => setMeal(i, { time: e.target.value })} />
              <input className={inputCls} placeholder={t("e.mealName")} value={m.name}
                onChange={(e) => setMeal(i, { name: e.target.value })} />
              <input className={inputCls} type="number" min={0} placeholder="kcal" value={m.kcal ?? ""}
                onChange={(e) => setMeal(i, { kcal: num(e.target.value) })} />
              <button type="button" className="px-2 text-muted hover:text-red-600" aria-label={t("e.removeMeal")}
                onClick={() => set({ meals: payload.meals.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </div>
            <textarea className={inputCls} rows={2} placeholder={t("e.mealItemsPh")}
              value={m.items} onChange={(e) => setMeal(i, { items: e.target.value })} />
          </div>
        ))}
        <button type="button" className="self-start text-sm font-medium text-ink-2 underline"
          onClick={() => set({ meals: [...payload.meals, { time: "16:00", name: t("default.snack"), items: "", kcal: null }] })}>
          {t("e.addMeal")}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Toggle label={t("e.askPhoto")} checked={options.ask_photo}
          onChange={(v) => onChange(payload, { ...options, ask_photo: v })} />
        <Toggle label={t("e.allowAlt")} checked={options.allow_alternative}
          onChange={(v) => onChange(payload, { ...options, allow_alternative: v })} />
        <Toggle label={t("e.trackWater")} checked={options.track_water}
          onChange={(v) => onChange(payload, { ...options, track_water: v })} />
      </div>
    </div>
  );
}

export function MeasureEditor({
  payload,
  options,
  onChange,
}: {
  payload: MeasurePayload;
  options: MeasureOptions;
  onChange: (p: MeasurePayload, o: MeasureOptions) => void;
}) {
  const { t } = useI18n();
  const toggleMetric = (m: MeasureMetric, on: boolean) =>
    onChange(
      { ...payload, metrics: on ? [...payload.metrics, m] : payload.metrics.filter((x) => x !== m) },
      options,
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted">{t("e.metrics")}</p>
        {(["weight", "waist", "hip", "body_fat"] as MeasureMetric[]).map((m) => (
          <Toggle key={m} label={t(`metric.${m}`)} checked={payload.metrics.includes(m)}
            onChange={(v) => toggleMetric(m, v)} />
        ))}
      </div>
      <Label text={t("e.when")}>
        <input className={inputCls} value={payload.when}
          onChange={(e) => onChange({ ...payload, when: e.target.value }, options)} />
      </Label>
      <div className="flex flex-col gap-1.5">
        <Toggle label={t("e.askPhotos")} checked={options.ask_photos}
          onChange={(v) => onChange(payload, { ...options, ask_photos: v })} />
        <Toggle label={t("e.showChart")} checked={options.show_chart}
          onChange={(v) => onChange(payload, { ...options, show_chart: v })} />
      </div>
    </div>
  );
}
