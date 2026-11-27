"use client";

import { DOMAINS, type DomainKey, type MeasureMetric, type MessageKey, type TFunction } from "@alaris/shared";
import { useI18n } from "@/components/i18n";
import { Card } from "@/components/ui";
import type { CoachingWeek } from "@/lib/tracking";
import { pct } from "@/lib/tracking";

const STATUS_STYLE: Record<string, { cls: string; label: MessageKey }> = {
  done: { cls: "bg-emerald-50 border-emerald-300 text-emerald-900", label: "taskStatus.done" },
  in_progress: { cls: "bg-sky-50 border-sky-300 text-sky-900", label: "taskStatus.in_progress" },
  missed: { cls: "bg-red-50 border-red-300 text-red-900", label: "taskStatus.missed" },
  pending: { cls: "bg-page border-line text-ink-2", label: "taskStatus.pending" },
};

export function ThisWeek({ week, days }: { week: CoachingWeek; days: Date[] }) {
  const { t, intl } = useI18n();
  const dayFmt = new Intl.DateTimeFormat(intl, { weekday: "short" });
  const today = new Date().toDateString();
  return (
    <Card title={`${t("web.thisWeek.title", { pct: pct(week.adherence) })}${week.planned ? ` (${week.done}/${week.planned})` : ""}`}>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const tasks = week.tasks.filter((x) => x.dayIndex === i);
          return (
            <div key={i} className={`flex min-h-24 flex-col gap-1.5 rounded-lg p-1.5 ${new Date(d).toDateString() === today ? "bg-soft" : ""}`}>
              <p className="text-xs font-semibold text-muted">
                {dayFmt.format(new Date(d))} {new Date(d).getDate()}
              </p>
              {tasks.map((x) => {
                const s = STATUS_STYLE[x.status];
                return (
                  <div
                    key={x.programTaskId}
                    className={`rounded-md border border-l-4 px-1.5 py-1 text-xs ${s.cls}`}
                    style={{ borderLeftColor: DOMAINS[x.domain as DomainKey]?.color }}
                  >
                    <span className="block font-medium leading-4">{x.title}</span>
                    <span className="block text-[10px] opacity-75">{t(s.label)}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">{t("web.adherence.explain")}</p>
    </Card>
  );
}

type Measurement = { metric: string; value: number; measured_on: string };

function LineChart({ points, color, label }: { points: { x: string; y: number }[]; color: string; label: string }) {
  if (points.length < 2) return null;
  const w = 520,
    h = 140,
    pad = 24;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys),
    max = Math.max(...ys);
  const span = max - min || 1;
  const xy = points.map((p, i) => [pad + (i * (w - 2 * pad)) / (points.length - 1), h - pad - ((p.y - min) * (h - 2 * pad)) / span]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={label}>
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={xy.map((p) => p.join(",")).join(" ")} />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={color} />
      ))}
      <text x={pad} y={14} fontSize="11" fill="#71717a">
        {max}
      </text>
      <text x={pad} y={h - 6} fontSize="11" fill="#71717a">
        {min}
      </text>
    </svg>
  );
}

export function Progress({ measurements }: { measurements: Measurement[] }) {
  const { t, intl } = useI18n();
  const shortDate = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" });
  const metrics = [...new Set(measurements.map((m) => m.metric))] as MeasureMetric[];
  return (
    <Card title={t("web.progress.title")}>
      {metrics.length === 0 ? (
        <p className="text-sm text-muted">{t("web.progress.empty")}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {metrics.map((metric) => {
            const rows = measurements.filter((m) => m.metric === metric);
            const first = rows[0],
              last = rows[rows.length - 1];
            const diff = Number(last.value) - Number(first.value);
            return (
              <div key={metric}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{t(`metric.${metric}`)}</span>
                  <span>
                    <span className="text-lg font-semibold">{last.value}</span>
                    {rows.length > 1 && (
                      <span className={`ml-2 text-xs ${diff <= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                        {diff > 0 ? "+" : ""}
                        {diff.toFixed(1)} ({t("web.progress.since", { date: shortDate.format(new Date(first.measured_on)) })})
                      </span>
                    )}
                  </span>
                </div>
                <LineChart
                  color="#C2410C"
                  label={t("web.progress.chart")}
                  points={rows.map((r) => ({ x: r.measured_on, y: Number(r.value) }))}
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

type Log = {
  id: string;
  kind: string;
  data: unknown;
  created_at: string;
  task_instances: { title: string; date: string; task_type_key: string } | null;
};

function describe(log: Log, t: TFunction) {
  const d = (log.data ?? {}) as Record<string, unknown>;
  switch (log.kind) {
    case "set":
      return t("web.log.set", {
        exercise: String(d.exercise_name ?? t("web.log.exercise")),
        n: Number(d.set_index ?? 0) + 1,
        kg: String(d.kg ?? "-"),
        reps: String(d.reps ?? "-"),
      });
    case "rpe":
      return t("web.log.rpe", { value: String(d.value) });
    case "meal_eaten":
      return t("web.log.meal", { name: String(d.name ?? "") });
    default:
      return log.kind;
  }
}

export function RecentLogs({ logs }: { logs: Log[] }) {
  const { t, intl } = useI18n();
  const dateTime = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <Card title={t("web.logs.title")}>
      {logs.length === 0 ? (
        <p className="text-sm text-muted">{t("web.logs.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {logs.map((l) => (
            <li key={l.id} className="flex gap-3">
              <span className="w-28 shrink-0 text-xs text-muted">{dateTime.format(new Date(l.created_at))}</span>
              <span>
                <span className="text-muted">{l.task_instances?.title} · </span>
                {describe(l, t)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
