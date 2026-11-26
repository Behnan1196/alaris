"use client";

import {
  INTENSITY_LABELS,
  MEASURE_METRIC_LABELS,
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

export const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-900";

export function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
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
    <label className="flex items-center gap-2 text-sm text-zinc-700">
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
  const set = (p: Partial<WorkoutPayload>) => onChange({ ...payload, ...p }, options);
  const setEx = (i: number, patch: Partial<WorkoutPayload["exercises"][number]>) =>
    set({ exercises: payload.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Label text="Tahmini süre (dk)">
          <input
            className={inputCls}
            type="number"
            min={0}
            value={payload.duration_min ?? ""}
            onChange={(e) => set({ duration_min: num(e.target.value) })}
          />
        </Label>
        <Label text="Yoğunluk">
          <select
            className={inputCls}
            value={payload.intensity}
            onChange={(e) => set({ intensity: e.target.value as Intensity })}
          >
            {Object.entries(INTENSITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-600">Hareketler</p>
        <datalist id="exercise-library">
          {exercises.map((e) => (
            <option key={e.id} value={e.name} />
          ))}
        </datalist>
        {payload.exercises.map((e, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-2">
            <div className="flex gap-2">
              <input
                className={inputCls}
                list="exercise-library"
                placeholder="Hareket adı (kütüphaneden seç ya da yaz)"
                value={e.name}
                onChange={(ev) => {
                  const match = exercises.find((x) => x.name === ev.target.value);
                  setEx(i, { name: ev.target.value, exercise_id: match?.id ?? null });
                }}
              />
              <button
                type="button"
                className="px-2 text-zinc-400 hover:text-red-600"
                onClick={() => set({ exercises: payload.exercises.filter((_, j) => j !== i) })}
                aria-label="Hareketi kaldır"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Label text="Set">
                <input className={inputCls} type="number" min={1} value={e.sets}
                  onChange={(ev) => setEx(i, { sets: Number(ev.target.value) || 1 })} />
              </Label>
              <Label text="Tekrar">
                <input className={inputCls} type="number" min={0} value={e.reps ?? ""}
                  onChange={(ev) => setEx(i, { reps: num(ev.target.value) })} />
              </Label>
              <Label text="Kilo (kg)">
                <input className={inputCls} type="number" min={0} step="0.5" value={e.weight_kg ?? ""}
                  onChange={(ev) => setEx(i, { weight_kg: num(ev.target.value) })} />
              </Label>
              <Label text="Dinlenme (sn)">
                <input className={inputCls} type="number" min={0} value={e.rest_sec}
                  onChange={(ev) => setEx(i, { rest_sec: Number(ev.target.value) || 0 })} />
              </Label>
            </div>
            <div className="grid grid-cols-[1fr_3fr] gap-2">
              <Label text="Süre (sn)">
                <input className={inputCls} type="number" min={0} value={e.duration_sec ?? ""}
                  placeholder="süreliyse"
                  onChange={(ev) => setEx(i, { duration_sec: num(ev.target.value) })} />
              </Label>
              <Label text="Not">
                <input className={inputCls} value={e.note ?? ""}
                  onChange={(ev) => setEx(i, { note: ev.target.value })} />
              </Label>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="self-start text-sm font-medium text-zinc-700 underline"
          onClick={() =>
            set({
              exercises: [
                ...payload.exercises,
                { name: "", sets: 3, reps: 10, weight_kg: null, rest_sec: 90, duration_sec: null, note: "" },
              ],
            })
          }
        >
          + Hareket ekle
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Toggle label="Her sette kilo ve tekrar girişi iste" checked={options.log_sets}
          onChange={(v) => onChange(payload, { ...options, log_sets: v })} />
        <Toggle label="Dinlenme sayacı otomatik başlasın" checked={options.auto_rest}
          onChange={(v) => onChange(payload, { ...options, auto_rest: v })} />
        <Toggle label="Sonunda zorluk puanı iste" checked={options.ask_rpe}
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
  const set = (p: Partial<MealPayload>) => onChange({ ...payload, ...p }, options);
  const setMeal = (i: number, patch: Partial<MealPayload["meals"][number]>) =>
    set({ meals: payload.meals.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const totalKcal = payload.meals.reduce((s, m) => s + (m.kcal ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        <Label text="Kalori hedefi">
          <input className={inputCls} type="number" min={0} value={payload.kcal_target ?? ""}
            onChange={(e) => set({ kcal_target: num(e.target.value) })} />
        </Label>
        <Label text="Protein (g)">
          <input className={inputCls} type="number" min={0} value={payload.protein_g ?? ""}
            onChange={(e) => set({ protein_g: num(e.target.value) })} />
        </Label>
        <Label text="Karb. (g)">
          <input className={inputCls} type="number" min={0} value={payload.carb_g ?? ""}
            onChange={(e) => set({ carb_g: num(e.target.value) })} />
        </Label>
        <Label text="Yağ (g)">
          <input className={inputCls} type="number" min={0} value={payload.fat_g ?? ""}
            onChange={(e) => set({ fat_g: num(e.target.value) })} />
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-600">
          Öğünler {totalKcal > 0 && <span className="text-zinc-400">· toplam {totalKcal} kcal</span>}
        </p>
        {payload.meals.map((m, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-2">
            <div className="grid grid-cols-[80px_1fr_90px_auto] gap-2">
              <input className={inputCls} type="time" value={m.time}
                onChange={(e) => setMeal(i, { time: e.target.value })} />
              <input className={inputCls} placeholder="Öğün adı" value={m.name}
                onChange={(e) => setMeal(i, { name: e.target.value })} />
              <input className={inputCls} type="number" min={0} placeholder="kcal" value={m.kcal ?? ""}
                onChange={(e) => setMeal(i, { kcal: num(e.target.value) })} />
              <button type="button" className="px-2 text-zinc-400 hover:text-red-600" aria-label="Öğünü kaldır"
                onClick={() => set({ meals: payload.meals.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </div>
            <textarea className={inputCls} rows={2} placeholder="İçerik ve porsiyonlar (ör. 2 yumurta, 50 g yulaf)"
              value={m.items} onChange={(e) => setMeal(i, { items: e.target.value })} />
          </div>
        ))}
        <button type="button" className="self-start text-sm font-medium text-zinc-700 underline"
          onClick={() => set({ meals: [...payload.meals, { time: "16:00", name: "Ara öğün", items: "", kcal: null }] })}>
          + Öğün ekle
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Toggle label="Öğün fotoğrafı iste" checked={options.ask_photo}
          onChange={(v) => onChange(payload, { ...options, ask_photo: v })} />
        <Toggle label="Alternatif öğün seçebilsin" checked={options.allow_alternative}
          onChange={(v) => onChange(payload, { ...options, allow_alternative: v })} />
        <Toggle label="Su takibini plana ekle" checked={options.track_water}
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
  const toggleMetric = (m: MeasureMetric, on: boolean) =>
    onChange(
      { ...payload, metrics: on ? [...payload.metrics, m] : payload.metrics.filter((x) => x !== m) },
      options,
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-zinc-600">Ölçülecekler</p>
        {(Object.keys(MEASURE_METRIC_LABELS) as MeasureMetric[]).map((m) => (
          <Toggle key={m} label={MEASURE_METRIC_LABELS[m]} checked={payload.metrics.includes(m)}
            onChange={(v) => toggleMetric(m, v)} />
        ))}
      </div>
      <Label text="Ne zaman">
        <input className={inputCls} value={payload.when}
          onChange={(e) => onChange({ ...payload, when: e.target.value }, options)} />
      </Label>
      <div className="flex flex-col gap-1.5">
        <Toggle label="Ön ve yan fotoğraf iste" checked={options.ask_photos}
          onChange={(v) => onChange(payload, { ...options, ask_photos: v })} />
        <Toggle label="Değişimi danışana grafikle göster" checked={options.show_chart}
          onChange={(v) => onChange(payload, { ...options, show_chart: v })} />
      </div>
    </div>
  );
}
