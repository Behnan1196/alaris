// Görev tiplerinin içerik (payload) ve seçenek (options) şemaları.
// Kaynak: docs/03-alanlar-ve-gorevler.md. Veritabanında program_tasks.payload / options (jsonb).

export type Intensity = "light" | "medium" | "high";

export const INTENSITY_LABELS: Record<Intensity, string> = {
  light: "Hafif",
  medium: "Orta",
  high: "Yüksek",
};

export interface WorkoutExercise {
  /** Kütüphanedeki hareket (exercises.id); serbest yazıldıysa boş. */
  exercise_id?: string | null;
  name: string;
  sets: number;
  /** Tekrar sayısı; süreli harekette boş. */
  reps?: number | null;
  /** Süreli hareket (ör. plank) için saniye. */
  duration_sec?: number | null;
  weight_kg?: number | null;
  rest_sec: number;
  note?: string;
  /** Bir önceki hareketle süperset: aralarında dinlenmeden art arda yapılır. */
  superset?: boolean;
}

export interface WorkoutPayload {
  duration_min: number | null;
  intensity: Intensity;
  exercises: WorkoutExercise[];
}

export interface WorkoutOptions {
  log_sets: boolean; // her sette kilo ve tekrar girişi iste
  auto_rest: boolean; // dinlenme sayacı otomatik başlasın
  ask_rpe: boolean; // sonunda zorluk puanı iste
}

export interface Meal {
  time: string; // "08:00"
  name: string; // "Kahvaltı"
  items: string; // içerik ve porsiyonlar, satır satır
  kcal: number | null;
}

export interface MealPayload {
  kcal_target: number | null;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  meals: Meal[];
}

export interface MealOptions {
  ask_photo: boolean;
  allow_alternative: boolean;
  track_water: boolean;
}

export type MeasureMetric = "weight" | "waist" | "hip" | "body_fat";

export const MEASURE_METRIC_LABELS: Record<MeasureMetric, string> = {
  weight: "Kilo (kg)",
  waist: "Bel (cm)",
  hip: "Kalça (cm)",
  body_fat: "Vücut yağ oranı (%)",
};

export interface MeasurePayload {
  metrics: MeasureMetric[];
  when: string; // ör. "Sabah aç karnına"
}

export interface MeasureOptions {
  ask_photos: boolean; // ön/yan fotoğraf
  show_chart: boolean; // değişimi danışana grafikle göster
}

export type TaskPayloads = {
  workout: { payload: WorkoutPayload; options: WorkoutOptions };
  meal: { payload: MealPayload; options: MealOptions };
  measure: { payload: MeasurePayload; options: MeasureOptions };
};

export type BuilderTaskType = keyof TaskPayloads;

export const DEFAULT_TASK: { [K in BuilderTaskType]: { title: string } & TaskPayloads[K] } = {
  workout: {
    title: "Antrenman",
    payload: { duration_min: 45, intensity: "medium", exercises: [] },
    options: { log_sets: true, auto_rest: true, ask_rpe: false },
  },
  meal: {
    title: "Beslenme planı",
    payload: {
      kcal_target: null,
      protein_g: null,
      carb_g: null,
      fat_g: null,
      meals: [
        { time: "08:00", name: "Kahvaltı", items: "", kcal: null },
        { time: "13:00", name: "Öğle", items: "", kcal: null },
        { time: "19:00", name: "Akşam", items: "", kcal: null },
      ],
    },
    options: { ask_photo: false, allow_alternative: false, track_water: false },
  },
  measure: {
    title: "Ölçüm",
    payload: { metrics: ["weight"], when: "Sabah aç karnına" },
    options: { ask_photos: false, show_chart: true },
  },
};

/** Haftanın günleri, 1 = Pazartesi (program_tasks.day_of_week). */
export const WEEKDAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;
export const WEEKDAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export type HabitFrequency = "daily" | "weekdays" | "three_per_week";
export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: "Her gün",
  weekdays: "Hafta içi",
  three_per_week: "Haftada 3",
};

export type ProgramRepeat = "once" | "four_weeks" | "until_end";
export const PROGRAM_REPEAT_LABELS: Record<ProgramRepeat, string> = {
  once: "Yalnızca 1 hafta",
  four_weeks: "4 hafta tekrarla",
  until_end: "Program bitene kadar tekrarla",
};

/**
 * MVP: koç tek bir haftalık şablon (week_no = 1) hazırlar; tekrar biçimine göre kaç hafta uygulanacağı.
 * Çok haftalı düzenleme açık soru (docs/10-acik-sorular.md, 10).
 */
export function activeWeeks(repeat: ProgramRepeat, weeks: number) {
  if (repeat === "once") return 1;
  if (repeat === "four_weeks") return Math.min(4, weeks);
  return weeks;
}

const dayIndex = (d: Date) => ((d.getDay() + 6) % 7) + 1; // 1 = Pazartesi
const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Bugün programın kaçıncı haftası ve haftanın hangi günü. Haftalar, başlangıç gününün
 * bulunduğu haftanın pazartesisinden sayılır. Başlamadıysa ya da bittiyse null.
 */
export function programDay(startDate: string, totalWeeks: number, today = new Date()) {
  const start = atMidnight(new Date(startDate + "T00:00:00"));
  const t = atMidnight(today);
  if (t < start) return null;
  const monday = new Date(start);
  monday.setDate(start.getDate() - (dayIndex(start) - 1));
  const days = Math.round((t.getTime() - monday.getTime()) / 86_400_000);
  const week = Math.floor(days / 7) + 1;
  if (week > totalWeeks) return null;
  return { week, dayOfWeek: dayIndex(t) };
}

/** Yerel tarih "YYYY-MM-DD" (Postgres date sütunları için). */
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Alışkanlık bugün gösterilmeli mi? (haftada 3: her gün gösterilir, hedef haftalık sayılır) */
export function habitDueOn(frequency: HabitFrequency, d = new Date()) {
  if (frequency === "weekdays") {
    const day = d.getDay();
    return day >= 1 && day <= 5;
  }
  return true;
}

/** Workout ilerleme kaydı (task_instances.progress). */
export interface WorkoutProgress {
  exercise_index: number;
  /** done[exerciseIndex][setIndex] = { kg, reps } */
  done: Record<string, Record<string, { kg: number | null; reps: number | null }>>;
  rpe?: number;
}

/** Beslenme ilerleme kaydı. */
export interface MealProgress {
  eaten: number[]; // öğün indeksleri
  water?: number; // bardak
}

/**
 * Bir program haftasının bir günündeki görevler. Koç o haftayı ayrıca düzenlediyse
 * (o hafta numarasıyla görev varsa) o haftanın görevleri, yoksa 1. hafta şablonu kullanılır.
 */
export function tasksForDay<T extends { week_no: number; day_of_week: number }>(tasks: T[], week: number, dayOfWeek: number) {
  const ownWeek = tasks.some((t) => t.week_no === week);
  const w = ownWeek ? week : 1;
  return tasks.filter((t) => t.week_no === w && t.day_of_week === dayOfWeek);
}
