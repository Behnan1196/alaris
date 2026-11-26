"use client";

import {
  DEFAULT_TASK,
  DOMAINS,
  HABIT_FREQUENCY_LABELS,
  INTENSITY_LABELS,
  MEASURE_METRIC_LABELS,
  PROGRAM_REPEAT_LABELS,
  TASK_TYPE_LABELS,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  type BuilderTaskType,
  type DomainKey,
  type HabitFrequency,
  type Json,
  type MealOptions,
  type MealPayload,
  type MeasureOptions,
  type MeasurePayload,
  type ProgramRepeat,
  type TaskTypeKey,
  type WorkoutOptions,
  type WorkoutPayload,
} from "@alaris/shared";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  copyTask,
  deleteHabit,
  deleteTask,
  saveHabit,
  saveTask,
  sendProgram,
  updateProgramMeta,
  type HabitInput,
} from "@/app/panel/program-actions";
import { MealEditor, MeasureEditor, Toggle, WorkoutEditor, inputCls, Label } from "./editors";

type Task = {
  id: string;
  day_of_week: number;
  task_type_key: string;
  title: string;
  payload: Json;
  options: Json;
  client_note: string | null;
};

type Habit = {
  id: string;
  title: string;
  frequency: HabitFrequency;
  target: number | null;
  unit: string | null;
  reminder_time: string | null;
  client_can_edit_target: boolean;
  show_streak: boolean;
};

type Program = {
  id: string;
  name: string;
  weeks: number;
  start_date: string | null;
  repeat: ProgramRepeat;
  status: string;
};

type Draft = Omit<Task, "id"> & { id?: string };

const TYPE_STYLE: Record<string, string> = {
  workout: "border-l-orange-600",
  meal: "border-l-lime-700",
  measure: "border-l-sky-600",
};

function taskMeta(t: { task_type_key: string; payload: Json }) {
  const p = t.payload as Record<string, unknown>;
  if (t.task_type_key === "workout") {
    const w = p as unknown as WorkoutPayload;
    return [`${w.exercises?.length ?? 0} hareket`, w.duration_min ? `${w.duration_min} dk` : null, INTENSITY_LABELS[w.intensity]]
      .filter(Boolean)
      .join(" · ");
  }
  if (t.task_type_key === "meal") {
    const m = p as unknown as MealPayload;
    return [`${m.meals?.length ?? 0} öğün`, m.kcal_target ? `${m.kcal_target} kcal` : null].filter(Boolean).join(" · ");
  }
  if (t.task_type_key === "measure") {
    const m = p as unknown as MeasurePayload;
    return (m.metrics ?? []).map((x) => MEASURE_METRIC_LABELS[x].split(" ")[0]).join(", ");
  }
  return "";
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Builder({
  path,
  coachingId,
  clientId,
  clientName,
  domain,
  program,
  tasks,
  habits,
  exercises,
}: {
  path: string;
  coachingId: string;
  clientId: string;
  clientName: string;
  domain: DomainKey;
  program: Program;
  tasks: Task[];
  habits: Habit[];
  exercises: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [habitDraft, setHabitDraft] = useState<(Partial<Habit> & { title: string }) | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [meta, setMeta] = useState({ name: program.name, weeks: program.weeks });

  const domainInfo = DOMAINS[domain];
  const taskTypes = domainInfo.taskTypes.filter((t): t is BuilderTaskType => t in DEFAULT_TASK);

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else {
        after?.();
        router.refresh();
      }
    });
  }

  function newTask(day: number, type: BuilderTaskType) {
    const def = DEFAULT_TASK[type];
    setHabitDraft(null);
    setDraft({
      day_of_week: day,
      task_type_key: type,
      title: def.title,
      payload: structuredClone(def.payload) as unknown as Json,
      options: structuredClone(def.options) as unknown as Json,
      client_note: "",
    });
  }

  const status =
    program.status === "active"
      ? `Aktif · ${program.start_date ?? ""} başladı · ${PROGRAM_REPEAT_LABELS[program.repeat]}`
      : "Taslak · danışan henüz görmüyor";

  return (
    <div className="flex flex-col gap-6">
      {/* Üst çubuk */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <Label text="Program adı">
          <input className={`${inputCls} w-64`} value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })}
            onBlur={() => meta.name !== program.name && run(() => updateProgramMeta(program.id, meta, path))} />
        </Label>
        <Label text="Süre (hafta)">
          <input className={`${inputCls} w-24`} type="number" min={1} max={52} value={meta.weeks}
            onChange={(e) => setMeta({ ...meta, weeks: Number(e.target.value) || 1 })}
            onBlur={() => meta.weeks !== program.weeks && run(() => updateProgramMeta(program.id, meta, path))} />
        </Label>
        <p className="flex-1 pb-2 text-sm text-zinc-500">{status}</p>
        <button
          onClick={() => setSendOpen((v) => !v)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: domainInfo.color }}
        >
          {program.status === "active" ? "Yeniden gönder" : "Danışana gönder"}
        </button>
      </div>

      {sendOpen && (
        <SendPanel
          clientName={clientName}
          defaultStart={program.start_date ?? today()}
          defaultRepeat={program.repeat}
          pending={pending}
          onSend={(startDate, repeat) =>
            run(
              () => sendProgram({ programId: program.id, coachingId, domain, startDate, repeat }, path),
              () => setSendOpen(false),
            )
          }
        />
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-6">
          {/* Haftalık takvim */}
          <div>
            <p className="mb-2 text-xs text-zinc-500">
              Haftalık şablon. Gönderirken seçtiğin tekrar biçimine göre her hafta uygulanır.
            </p>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((dayName, i) => {
                const day = i + 1;
                const dayTasks = tasks.filter((t) => t.day_of_week === day);
                return (
                  <div key={day} className="flex min-h-56 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2">
                    <p className="text-xs font-semibold text-zinc-500" title={dayName}>
                      {WEEKDAYS_SHORT[i]}
                    </p>
                    {dayTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setHabitDraft(null);
                          setDraft({ ...t, client_note: t.client_note ?? "" });
                        }}
                        className={`rounded-md border border-l-4 border-zinc-200 bg-zinc-50 p-2 text-left text-xs hover:bg-zinc-100 ${
                          TYPE_STYLE[t.task_type_key] ?? ""
                        } ${draft?.id === t.id ? "ring-2 ring-zinc-900" : ""}`}
                      >
                        <span className="block text-[10px] uppercase tracking-wide text-zinc-500">
                          {TASK_TYPE_LABELS[t.task_type_key as TaskTypeKey]}
                        </span>
                        <span className="block font-medium">{t.title}</span>
                        <span className="block text-zinc-500">{taskMeta(t)}</span>
                      </button>
                    ))}
                    <AddMenu types={taskTypes} onPick={(type) => newTask(day, type)} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alışkanlık şeridi */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Alışkanlıklar</h3>
              <button
                className="text-sm font-medium underline"
                onClick={() => {
                  setDraft(null);
                  setHabitDraft({ title: "", frequency: "daily", show_streak: true, client_can_edit_target: false });
                }}
              >
                + Alışkanlık ekle
              </button>
            </div>
            {habits.length === 0 ? (
              <p className="text-sm text-zinc-500">Haftaya bağlı alışkanlık yok (ör. günde 8 bardak su).</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {habits.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setDraft(null);
                      setHabitDraft(h);
                    }}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
                  >
                    {h.title}
                    <span className="text-zinc-500">
                      {" "}
                      · {HABIT_FREQUENCY_LABELS[h.frequency]}
                      {h.target ? ` · ${h.target}${h.unit ? " " + h.unit : ""}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ panel */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          {draft ? (
            <TaskPanel
              key={draft.id ?? `new-${draft.day_of_week}-${draft.task_type_key}`}
              draft={draft}
              exercises={exercises}
              pending={pending}
              color={domainInfo.color}
              onClose={() => setDraft(null)}
              onSave={(d) =>
                run(
                  () => saveTask({ ...d, program_id: program.id }, path),
                  () => setDraft(null),
                )
              }
              onDelete={
                draft.id ? () => run(() => deleteTask(draft.id!, path), () => setDraft(null)) : undefined
              }
              onCopy={draft.id ? (day) => run(() => copyTask(draft.id!, day, path)) : undefined}
            />
          ) : habitDraft ? (
            <HabitPanel
              key={habitDraft.id ?? "new"}
              habit={habitDraft}
              pending={pending}
              onClose={() => setHabitDraft(null)}
              onSave={(h) =>
                run(
                  () =>
                    saveHabit(
                      { ...h, coaching_id: coachingId, client_id: clientId, program_id: program.id, domain_key: domain },
                      path,
                    ),
                  () => setHabitDraft(null),
                )
              }
              onDelete={
                habitDraft.id ? () => run(() => deleteHabit(habitDraft.id!, path), () => setHabitDraft(null)) : undefined
              }
            />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
              Bir güne görev eklemek için &quot;+ Görev&quot;e, düzenlemek için bir karta tıkla.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddMenu({ types, onPick }: { types: BuilderTaskType[]; onPick: (t: BuilderTaskType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mt-auto">
      <button onClick={() => setOpen((v) => !v)} className="w-full rounded-md py-1 text-xs text-zinc-500 hover:bg-zinc-100">
        + Görev
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-40 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
          {types.map((t) => (
            <button
              key={t}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
              onClick={() => {
                setOpen(false);
                onPick(t);
              }}
            >
              {TASK_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskPanel({
  draft,
  exercises,
  pending,
  color,
  onClose,
  onSave,
  onDelete,
  onCopy,
}: {
  draft: Draft;
  exercises: { id: string; name: string }[];
  pending: boolean;
  color: string;
  onClose: () => void;
  onSave: (d: Draft) => void;
  onDelete?: () => void;
  onCopy?: (day: number) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const setPO = (payload: unknown, options: unknown) =>
    setD({ ...d, payload: payload as Json, options: options as Json });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {TASK_TYPE_LABELS[d.task_type_key as TaskTypeKey]}
        </p>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900" aria-label="Kapat">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-[1fr_130px] gap-3">
        <Label text="Başlık">
          <input className={inputCls} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        </Label>
        <Label text="Gün">
          <select className={inputCls} value={d.day_of_week} onChange={(e) => setD({ ...d, day_of_week: Number(e.target.value) })}>
            {WEEKDAYS.map((w, i) => (
              <option key={w} value={i + 1}>
                {w}
              </option>
            ))}
          </select>
        </Label>
      </div>

      {d.task_type_key === "workout" && (
        <WorkoutEditor
          payload={d.payload as unknown as WorkoutPayload}
          options={d.options as unknown as WorkoutOptions}
          onChange={setPO}
          exercises={exercises}
        />
      )}
      {d.task_type_key === "meal" && (
        <MealEditor payload={d.payload as unknown as MealPayload} options={d.options as unknown as MealOptions} onChange={setPO} />
      )}
      {d.task_type_key === "measure" && (
        <MeasureEditor
          payload={d.payload as unknown as MeasurePayload}
          options={d.options as unknown as MeasureOptions}
          onChange={setPO}
        />
      )}

      <Label text="Danışana not">
        <textarea className={inputCls} rows={2} value={d.client_note ?? ""}
          onChange={(e) => setD({ ...d, client_note: e.target.value })} />
      </Label>

      <Preview draft={d} color={color} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={pending}
          onClick={() => onSave(d)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {onCopy && (
          <select
            className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
            value=""
            onChange={(e) => e.target.value && onCopy(Number(e.target.value))}
          >
            <option value="">Başka güne kopyala…</option>
            {WEEKDAYS.map((w, i) => (
              <option key={w} value={i + 1}>
                {w}
              </option>
            ))}
          </select>
        )}
        {onDelete && (
          <button disabled={pending} onClick={onDelete} className="ml-auto text-sm text-red-600 underline">
            Sil
          </button>
        )}
      </div>
    </div>
  );
}

/** "Danışan uygulamasında böyle görünür" önizlemesi. */
function Preview({ draft, color }: { draft: Draft; color: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-zinc-500">Danışan uygulamasında böyle görünür</p>
      <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: color }}>
        <p className="text-xs opacity-80">{TASK_TYPE_LABELS[draft.task_type_key as TaskTypeKey]}</p>
        <p className="text-lg font-bold leading-6">{draft.title || "Görev"}</p>
        <p className="text-xs opacity-90">{taskMeta(draft)}</p>
        {draft.client_note && <p className="mt-2 rounded-lg bg-white/15 p-2 text-xs">“{draft.client_note}”</p>}
      </div>
    </div>
  );
}

function HabitPanel({
  habit,
  pending,
  onClose,
  onSave,
  onDelete,
}: {
  habit: Partial<Habit> & { title: string };
  pending: boolean;
  onClose: () => void;
  onSave: (h: Omit<HabitInput, "coaching_id" | "client_id" | "program_id" | "domain_key">) => void;
  onDelete?: () => void;
}) {
  const [h, setH] = useState({
    id: habit.id,
    title: habit.title,
    frequency: habit.frequency ?? ("daily" as HabitFrequency),
    target: habit.target ?? null,
    unit: habit.unit ?? "",
    reminder_time: habit.reminder_time?.slice(0, 5) ?? "",
    client_can_edit_target: habit.client_can_edit_target ?? false,
    show_streak: habit.show_streak ?? true,
  });
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Alışkanlık</p>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900" aria-label="Kapat">
          ✕
        </button>
      </div>
      <Label text="Ad">
        <input className={inputCls} placeholder="ör. Su iç" value={h.title} onChange={(e) => setH({ ...h, title: e.target.value })} />
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <Label text="Sıklık">
          <select className={inputCls} value={h.frequency} onChange={(e) => setH({ ...h, frequency: e.target.value as HabitFrequency })}>
            {Object.entries(HABIT_FREQUENCY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Label>
        <Label text="Günlük hedef">
          <input className={inputCls} type="number" min={0} placeholder="boşsa tek dokunuş" value={h.target ?? ""}
            onChange={(e) => setH({ ...h, target: e.target.value === "" ? null : Number(e.target.value) })} />
        </Label>
        <Label text="Birim">
          <input className={inputCls} placeholder="bardak, adım" value={h.unit} onChange={(e) => setH({ ...h, unit: e.target.value })} />
        </Label>
      </div>
      <Label text="Hatırlatma saati">
        <input className={`${inputCls} w-32`} type="time" value={h.reminder_time}
          onChange={(e) => setH({ ...h, reminder_time: e.target.value })} />
      </Label>
      <div className="flex flex-col gap-1.5">
        <Toggle label="Danışan hedefi değiştirebilsin" checked={h.client_can_edit_target}
          onChange={(v) => setH({ ...h, client_can_edit_target: v })} />
        <Toggle label="Seri sayacını göster" checked={h.show_streak} onChange={(v) => setH({ ...h, show_streak: v })} />
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={pending || !h.title.trim()}
          onClick={() => onSave(h)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {onDelete && (
          <button disabled={pending} onClick={onDelete} className="ml-auto text-sm text-red-600 underline">
            Kaldır
          </button>
        )}
      </div>
    </div>
  );
}

function SendPanel({
  clientName,
  defaultStart,
  defaultRepeat,
  pending,
  onSend,
}: {
  clientName: string;
  defaultStart: string;
  defaultRepeat: ProgramRepeat;
  pending: boolean;
  onSend: (startDate: string, repeat: ProgramRepeat) => void;
}) {
  const [startDate, setStartDate] = useState(defaultStart);
  const [repeat, setRepeat] = useState<ProgramRepeat>(defaultRepeat);
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-900 bg-white p-4">
      <p className="w-full text-sm">
        <span className="font-medium">{clientName || "Danışan"}</span> bu programı uygulamasında görecek. Aynı alandaki
        önceki aktif program tamamlandı olarak kapanır.
      </p>
      <Label text="Başlangıç tarihi">
        <input className={`${inputCls} w-44`} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Label>
      <Label text="Tekrar">
        <select className={`${inputCls} w-64`} value={repeat} onChange={(e) => setRepeat(e.target.value as ProgramRepeat)}>
          {Object.entries(PROGRAM_REPEAT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Label>
      <button
        disabled={pending}
        onClick={() => onSend(startDate, repeat)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Gönderiliyor…" : "Gönder"}
      </button>
      <p className="w-full text-xs text-zinc-400">Bildirim gönderme 6. adımda (mesajlar ve bildirimler) eklenecek.</p>
    </div>
  );
}
