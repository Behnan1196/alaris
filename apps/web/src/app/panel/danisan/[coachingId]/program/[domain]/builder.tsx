"use client";

import {
  DEFAULT_TASK,
  DOMAINS,
  weekdayName,
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
  type TFunction,
  type WorkoutOptions,
  type WorkoutPayload,
} from "@alaris/shared";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  copyTask,
  copyWeek,
  moveTask,
  resetWeek,
  deleteHabit,
  deleteTask,
  saveHabit,
  saveTask,
  sendProgram,
  updateProgramMeta,
  type HabitInput,
} from "@/app/panel/program-actions";
import { useI18n } from "@/components/i18n";
import { MealEditor, MeasureEditor, Toggle, WorkoutEditor, inputCls, Label } from "./editors";

type Task = {
  id: string;
  week_no: number;
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

function taskMeta(tk: { task_type_key: string; payload: Json }, t: TFunction) {
  const p = tk.payload as Record<string, unknown>;
  if (tk.task_type_key === "workout") {
    const w = p as unknown as WorkoutPayload;
    return [t("b.meta.exercises", { n: w.exercises?.length ?? 0 }), w.duration_min ? t("b.meta.minutes", { n: w.duration_min }) : null, t(`intensity.${w.intensity}`)]
      .filter(Boolean)
      .join(" · ");
  }
  if (tk.task_type_key === "meal") {
    const m = p as unknown as MealPayload;
    return [t("b.meta.meals", { n: m.meals?.length ?? 0 }), m.kcal_target ? `${m.kcal_target} kcal` : null].filter(Boolean).join(" · ");
  }
  if (tk.task_type_key === "measure") {
    const m = p as unknown as MeasurePayload;
    return (m.metrics ?? []).map((x) => t(`metricShort.${x}`)).join(", ");
  }
  return "";
}

/** Varsayılan görev içeriğindeki metinleri (öğün adları, ölçüm zamanı) seçili dile çevirir. */
function localizeDefaults(type: BuilderTaskType, payload: unknown, t: TFunction) {
  if (type === "meal") {
    const p = payload as MealPayload;
    const names = [t("default.breakfast"), t("default.lunch"), t("default.dinner")];
    p.meals = p.meals.map((m, i) => ({ ...m, name: names[i] ?? m.name }));
  }
  if (type === "measure") (payload as MeasurePayload).when = t("default.measureWhen");
  return payload;
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
  const { t, intl } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [habitDraft, setHabitDraft] = useState<(Partial<Habit> & { title: string }) | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [meta, setMeta] = useState({ name: program.name, weeks: program.weeks });
  const [week, setWeek] = useState(1);
  // Sürükle-bırak: sürüklenen kart ref'te (her olayda yeniden çizim yok), taşıma anında yerelde
  // uygulanır, sunucuya arka planda yazılır (sayfanın tamamı yeniden yüklenmez).
  const dragId = useRef<string | null>(null);
  const [overDay, setOverDay] = useState<number | null>(null);
  const [local, setLocal] = useState(tasks);
  const [prevTasks, setPrevTasks] = useState(tasks);
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setLocal(tasks);
  }

  function dropOn(day: number) {
    const id = dragId.current;
    dragId.current = null;
    setOverDay(null);
    const tk = local.find((x) => x.id === id);
    if (!tk || tk.day_of_week === day) return;
    const before = local;
    setLocal(local.map((x) => (x.id === tk.id ? { ...x, day_of_week: day } : x)));
    moveTask(tk.id, day).then((r) => {
      if (r.error) {
        setError(r.error);
        setLocal(before);
      }
    });
  }

  // Hafta: kendi görevi varsa onlar, yoksa 1. hafta şablonu (salt okunur gösterilir).
  const weeksWithOwn = new Set(local.map((x) => x.week_no));
  const ownWeek = week === 1 || weeksWithOwn.has(week);
  const weekTasks = local.filter((x) => x.week_no === (ownWeek ? week : 1));
  const editable = ownWeek;

  const domainInfo = DOMAINS[domain];
  const taskTypes = domainInfo.taskTypes.filter((x): x is BuilderTaskType => x in DEFAULT_TASK);

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
      week_no: week,
      day_of_week: day,
      task_type_key: type,
      title: t(`default.${type}`),
      payload: localizeDefaults(type, structuredClone(def.payload), t) as unknown as Json,
      options: structuredClone(def.options) as unknown as Json,
      client_note: "",
    });
  }

  const status =
    program.status === "active"
      ? t("b.status.active", { date: program.start_date ?? "", repeat: t(`repeat.${program.repeat}`) })
      : t("b.status.draft");

  return (
    <div className="flex flex-col gap-6">
      {/* Üst çubuk */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
        <Label text={t("b.programName")}>
          <input className={`${inputCls} w-64`} value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })}
            onBlur={() => meta.name !== program.name && run(() => updateProgramMeta(program.id, meta, path))} />
        </Label>
        <Label text={t("b.weeks")}>
          <input className={`${inputCls} w-24`} type="number" min={1} max={52} value={meta.weeks}
            onChange={(e) => setMeta({ ...meta, weeks: Number(e.target.value) || 1 })}
            onBlur={() => meta.weeks !== program.weeks && run(() => updateProgramMeta(program.id, meta, path))} />
        </Label>
        <p className="flex-1 pb-2 text-sm text-muted">{status}</p>
        <button
          onClick={() => setSendOpen((v) => !v)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: domainInfo.color }}
        >
          {program.status === "active" ? t("b.resend") : t("b.send")}
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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1" role="tablist" aria-label={t("b.weeksTabs")}>
                {Array.from({ length: program.weeks }, (_, i) => i + 1).map((w) => (
                  <button
                    key={w}
                    role="tab"
                    aria-selected={w === week}
                    onClick={() => {
                      setWeek(w);
                      setDraft(null);
                    }}
                    className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-medium ${
                      w === week ? "border-ink bg-ink text-white" : "border-line bg-surface hover:bg-soft"
                    }`}
                    title={w === 1 || weeksWithOwn.has(w) ? t("b.weekN", { n: w }) : t("b.weekNTemplate", { n: w })}
                  >
                    {w}
                    {w > 1 && weeksWithOwn.has(w) ? "•" : ""}
                  </button>
                ))}
              </div>
              <select
                className="ml-auto h-8 rounded-lg border border-line bg-surface px-2 text-xs"
                value=""
                disabled={pending}
                onChange={(e) => {
                  const to = Number(e.target.value);
                  if (to && confirm(t("b.copyWeekConfirm", { from: week, to })))
                    run(() => copyWeek(program.id, ownWeek ? week : 1, to, path), () => setWeek(to));
                }}
              >
                <option value="">{t("b.copyWeek")}</option>
                {Array.from({ length: program.weeks }, (_, i) => i + 1)
                  .filter((w) => w !== week)
                  .map((w) => (
                    <option key={w} value={w}>
                      {t("b.toWeek", { n: w })}
                    </option>
                  ))}
              </select>
            </div>
            {!editable ? (
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-sm">
                <span className="flex-1 text-muted">{t("b.usesTemplate", { n: week })}</span>
                <button
                  disabled={pending}
                  onClick={() => run(() => copyWeek(program.id, 1, week, path))}
                  className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {t("b.editSeparately")}
                </button>
              </div>
            ) : week > 1 ? (
              <p className="mb-3 text-xs text-muted">
                {t("b.editingSeparately", { n: week })}{" "}
                <button className="underline" disabled={pending} onClick={() => confirm(t("b.resetConfirm", { n: week })) && run(() => resetWeek(program.id, week, path))}>
                  {t("b.reset")}
                </button>
              </p>
            ) : (
              <p className="mb-3 text-xs text-muted">
                {t("b.templateHint")}
              </p>
            )}
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const day = i + 1;
                const dayTasks = weekTasks.filter((x) => x.day_of_week === day);
                return (
                  <div
                    key={day}
                    onDragOver={(e) => {
                      if (!dragId.current || !editable) return;
                      e.preventDefault();
                      if (overDay !== day) setOverDay(day);
                    }}
                    onDragLeave={() => setOverDay((d) => (d === day ? null : d))}
                    onDrop={(e) => {
                      e.preventDefault();
                      dropOn(day);
                    }}
                    className={`flex min-h-56 flex-col gap-2 rounded-xl border p-2 ${
                      overDay === day ? "border-ink bg-soft" : "border-line bg-surface"
                    } ${editable ? "" : "opacity-60"}`}
                  >
                    <p className="text-xs font-semibold text-muted" title={weekdayName(intl, i)}>
                      {weekdayName(intl, i, "short")}
                    </p>
                    {dayTasks.map((tk) => (
                      <button
                        key={tk.id}
                        draggable={editable}
                        onDragStart={() => (dragId.current = tk.id)}
                        onDragEnd={() => {
                          dragId.current = null;
                          setOverDay(null);
                        }}
                        disabled={!editable}
                        onClick={() => {
                          setHabitDraft(null);
                          setDraft({ ...tk, client_note: tk.client_note ?? "" });
                        }}
                        className={`rounded-md border border-l-4 border-line bg-page p-2 text-left text-xs hover:bg-soft ${
                          TYPE_STYLE[tk.task_type_key] ?? ""
                        } ${draft?.id === tk.id ? "ring-2 ring-ink" : ""}`}
                      >
                        <span className="block text-[10px] uppercase tracking-wide text-muted">
                          {t(`taskType.${tk.task_type_key as TaskTypeKey}`)}
                        </span>
                        <span className="block font-medium">{tk.title}</span>
                        <span className="block text-muted">{taskMeta(tk, t)}</span>
                      </button>
                    ))}
                    {editable && <AddMenu types={taskTypes} onPick={(type) => newTask(day, type)} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alışkanlık şeridi */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("web.tab.habits")}</h3>
              <button
                className="text-sm font-medium underline"
                onClick={() => {
                  setDraft(null);
                  setHabitDraft({ title: "", frequency: "daily", show_streak: true, client_can_edit_target: false });
                }}
              >
                {t("b.addHabit")}
              </button>
            </div>
            {habits.length === 0 ? (
              <p className="text-sm text-muted">{t("b.noHabits")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {habits.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setDraft(null);
                      setHabitDraft(h);
                    }}
                    className="rounded-full border border-line px-3 py-1 text-sm hover:bg-soft"
                  >
                    {h.title}
                    <span className="text-muted">
                      {" "}
                      · {t(`freq.${h.frequency}`)}
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
            <div className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
              {t("b.emptyPanel")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddMenu({ types, onPick }: { types: BuilderTaskType[]; onPick: (type: BuilderTaskType) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mt-auto">
      <button onClick={() => setOpen((v) => !v)} className="w-full rounded-md py-1 text-xs text-muted hover:bg-soft">
        {t("b.addTask")}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-40 rounded-lg border border-line bg-white p-1 shadow-lg">
          {types.map((type) => (
            <button
              key={type}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-soft"
              onClick={() => {
                setOpen(false);
                onPick(type);
              }}
            >
              {t(`taskType.${type}`)}
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
  const { t, intl } = useI18n();
  const [d, setD] = useState<Draft>(draft);
  const setPO = (payload: unknown, options: unknown) =>
    setD({ ...d, payload: payload as Json, options: options as Json });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t(`taskType.${d.task_type_key as TaskTypeKey}`)}
        </p>
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label={t("common.close")}>
          ✕
        </button>
      </div>
      <div className="grid grid-cols-[1fr_130px] gap-3">
        <Label text={t("b.title")}>
          <input className={inputCls} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        </Label>
        <Label text={t("b.day")}>
          <select className={inputCls} value={d.day_of_week} onChange={(e) => setD({ ...d, day_of_week: Number(e.target.value) })}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <option key={i} value={i + 1}>
                {weekdayName(intl, i)}
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

      <Label text={t("b.clientNote")}>
        <textarea className={inputCls} rows={2} value={d.client_note ?? ""}
          onChange={(e) => setD({ ...d, client_note: e.target.value })} />
      </Label>

      <Preview draft={d} color={color} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={pending}
          onClick={() => onSave(d)}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? t("common.saving") : t("common.save")}
        </button>
        {onCopy && (
          <select
            className="rounded-lg border border-line px-2 py-2 text-sm"
            value=""
            onChange={(e) => e.target.value && onCopy(Number(e.target.value))}
          >
            <option value="">{t("b.copyToDay")}</option>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <option key={i} value={i + 1}>
                {weekdayName(intl, i)}
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
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted">{t("b.preview")}</p>
      <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: color }}>
        <p className="text-xs opacity-80">{t(`taskType.${draft.task_type_key as TaskTypeKey}`)}</p>
        <p className="text-lg font-bold leading-6">{draft.title || t("b.task")}</p>
        <p className="text-xs opacity-90">{taskMeta(draft, t)}</p>
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
  const { t } = useI18n();
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
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("taskType.habit")}</p>
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label={t("common.close")}>
          ✕
        </button>
      </div>
      <Label text={t("b.habitName")}>
        <input className={inputCls} placeholder={t("b.habitNamePh")} value={h.title} onChange={(e) => setH({ ...h, title: e.target.value })} />
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <Label text={t("b.frequency")}>
          <select className={inputCls} value={h.frequency} onChange={(e) => setH({ ...h, frequency: e.target.value as HabitFrequency })}>
            {(["daily", "weekdays", "three_per_week"] as const).map((k) => (
              <option key={k} value={k}>
                {t(`freq.${k}`)}
              </option>
            ))}
          </select>
        </Label>
        <Label text={t("b.dailyTarget")}>
          <input className={inputCls} type="number" min={0} placeholder={t("b.dailyTargetPh")} value={h.target ?? ""}
            onChange={(e) => setH({ ...h, target: e.target.value === "" ? null : Number(e.target.value) })} />
        </Label>
        <Label text={t("b.unit")}>
          <input className={inputCls} placeholder={t("b.unitPh")} value={h.unit} onChange={(e) => setH({ ...h, unit: e.target.value })} />
        </Label>
      </div>
      <Label text={t("b.reminder")}>
        <input className={`${inputCls} w-32`} type="time" value={h.reminder_time}
          onChange={(e) => setH({ ...h, reminder_time: e.target.value })} />
      </Label>
      <div className="flex flex-col gap-1.5">
        <Toggle label={t("b.clientCanEdit")} checked={h.client_can_edit_target}
          onChange={(v) => setH({ ...h, client_can_edit_target: v })} />
        <Toggle label={t("b.showStreak")} checked={h.show_streak} onChange={(v) => setH({ ...h, show_streak: v })} />
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={pending || !h.title.trim()}
          onClick={() => onSave(h)}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? t("common.saving") : t("common.save")}
        </button>
        {onDelete && (
          <button disabled={pending} onClick={onDelete} className="ml-auto text-sm text-red-600 underline">
            {t("common.remove")}
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
  const { t } = useI18n();
  const [startDate, setStartDate] = useState(defaultStart);
  const [repeat, setRepeat] = useState<ProgramRepeat>(defaultRepeat);
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-ink bg-white p-4">
      <p className="w-full text-sm">
        {t("b.sendInfo", { name: clientName || t("web.col.client") })}
      </p>
      <Label text={t("b.startDate")}>
        <input className={`${inputCls} w-44`} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Label>
      <Label text={t("b.repeat")}>
        <select className={`${inputCls} w-64`} value={repeat} onChange={(e) => setRepeat(e.target.value as ProgramRepeat)}>
          {(["once", "four_weeks", "until_end"] as const).map((k) => (
            <option key={k} value={k}>
              {t(`repeat.${k}`)}
            </option>
          ))}
        </select>
      </Label>
      <button
        disabled={pending}
        onClick={() => onSend(startDate, repeat)}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? t("b.sending") : t("b.sendShort")}
      </button>
      <p className="w-full text-xs text-muted">{t("b.sendNotify")}</p>
    </div>
  );
}
