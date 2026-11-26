import { DOMAINS, MEASURE_METRIC_LABELS, WEEKDAYS_SHORT, type DomainKey, type MeasureMetric } from "@alaris/shared";
import { Card } from "@/components/ui";
import type { CoachingWeek } from "@/lib/tracking";
import { pct } from "@/lib/tracking";

const STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  done: { cls: "bg-emerald-50 border-emerald-300 text-emerald-900", label: "Tamam" },
  in_progress: { cls: "bg-sky-50 border-sky-300 text-sky-900", label: "Devam ediyor" },
  missed: { cls: "bg-red-50 border-red-300 text-red-900", label: "Kaçırıldı" },
  pending: { cls: "bg-zinc-50 border-zinc-200 text-zinc-700", label: "Bekliyor" },
};

export function ThisWeek({ week, days }: { week: CoachingWeek; days: Date[] }) {
  const today = new Date().toDateString();
  return (
    <Card title={`Bu hafta · uyum ${pct(week.adherence)}${week.planned ? ` (${week.done}/${week.planned})` : ""}`}>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const tasks = week.tasks.filter((t) => t.dayIndex === i);
          return (
            <div key={i} className={`flex min-h-24 flex-col gap-1.5 rounded-lg p-1.5 ${d.toDateString() === today ? "bg-zinc-100" : ""}`}>
              <p className="text-xs font-semibold text-zinc-500">
                {WEEKDAYS_SHORT[i]} {d.getDate()}
              </p>
              {tasks.map((t) => {
                const s = STATUS_STYLE[t.status];
                return (
                  <div key={t.programTaskId} className={`rounded-md border border-l-4 px-1.5 py-1 text-xs ${s.cls}`}
                    style={{ borderLeftColor: DOMAINS[t.domain as DomainKey]?.color }}>
                    <span className="block font-medium leading-4">{t.title}</span>
                    <span className="block text-[10px] opacity-75">{s.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-zinc-500">Uyum: bugüne kadar planlanan görevler ve atadığın alışkanlıklar içinde tamamlananların oranı.</p>
    </Card>
  );
}

type Measurement = { metric: string; value: number; measured_on: string };

function LineChart({ points, color }: { points: { x: string; y: number }[]; color: string }) {
  if (points.length < 2) return null;
  const w = 520, h = 140, pad = 24;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  const xy = points.map((p, i) => [
    pad + (i * (w - 2 * pad)) / (points.length - 1),
    h - pad - ((p.y - min) * (h - 2 * pad)) / span,
  ]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Değişim grafiği">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={xy.map((p) => p.join(",")).join(" ")} />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={color} />
      ))}
      <text x={pad} y={14} fontSize="11" fill="#71717a">{max}</text>
      <text x={pad} y={h - 6} fontSize="11" fill="#71717a">{min}</text>
    </svg>
  );
}

const shortDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

export function Progress({ measurements }: { measurements: Measurement[] }) {
  const metrics = [...new Set(measurements.map((m) => m.metric))] as MeasureMetric[];
  return (
    <Card title="İlerleme">
      {metrics.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz ölçüm yok. Programa bir ölçüm görevi ekleyebilirsin.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {metrics.map((metric) => {
            const rows = measurements.filter((m) => m.metric === metric);
            const first = rows[0], last = rows[rows.length - 1];
            const diff = Number(last.value) - Number(first.value);
            return (
              <div key={metric}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{MEASURE_METRIC_LABELS[metric]}</span>
                  <span>
                    <span className="text-lg font-semibold">{last.value}</span>
                    {rows.length > 1 && (
                      <span className={`ml-2 text-xs ${diff <= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                        {diff > 0 ? "+" : ""}
                        {diff.toFixed(1)} ({shortDate.format(new Date(first.measured_on))}&apos;dan beri)
                      </span>
                    )}
                  </span>
                </div>
                <LineChart color="#C2410C" points={rows.map((r) => ({ x: r.measured_on, y: Number(r.value) }))} />
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

const dateTime = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function describe(log: Log) {
  const d = (log.data ?? {}) as Record<string, unknown>;
  switch (log.kind) {
    case "set":
      return `${d.exercise_name ?? "Hareket"}: set ${Number(d.set_index ?? 0) + 1} · ${d.kg ?? "-"} kg × ${d.reps ?? "-"}`;
    case "rpe":
      return `Zorluk puanı: ${d.value}/10`;
    case "meal_eaten":
      return `Öğün yendi: ${d.name ?? ""}`;
    default:
      return log.kind;
  }
}

export function RecentLogs({ logs }: { logs: Log[] }) {
  return (
    <Card title="Son kayıtlar">
      {logs.length === 0 ? (
        <p className="text-sm text-zinc-500">Danışan henüz kayıt girmedi.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {logs.map((l) => (
            <li key={l.id} className="flex gap-3">
              <span className="w-28 shrink-0 text-xs text-zinc-500">{dateTime.format(new Date(l.created_at))}</span>
              <span>
                <span className="text-zinc-500">{l.task_instances?.title} · </span>
                {describe(l)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
