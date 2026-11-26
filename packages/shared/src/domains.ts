// Koçluk alanları. Kaynak: docs/03-alanlar-ve-gorevler.md
export const DOMAIN_KEYS = ["fitness", "nutrition", "exam", "guitar"] as const;
export type DomainKey = (typeof DOMAIN_KEYS)[number];

export const TASK_TYPE_KEYS = [
  "workout",
  "meal",
  "measure",
  "habit",
  "study",
  "exam",
  "lesson",
  "guitar",
] as const;
export type TaskTypeKey = (typeof TASK_TYPE_KEYS)[number];

export interface DomainInfo {
  key: DomainKey;
  name: string;
  color: string;
  /** MVP'de etkin mi; değilse "Yakında" yer tutucusu gösterilir. */
  enabled: boolean;
  taskTypes: readonly TaskTypeKey[];
}

export const DOMAINS: Record<DomainKey, DomainInfo> = {
  fitness: {
    key: "fitness",
    name: "Fitness",
    color: "#C2410C",
    enabled: true,
    taskTypes: ["workout", "measure"],
  },
  nutrition: {
    key: "nutrition",
    name: "Beslenme",
    color: "#4D7C0F",
    enabled: true,
    taskTypes: ["meal", "measure"],
  },
  exam: {
    key: "exam",
    name: "Sınav Koçluğu",
    color: "#1D4ED8",
    enabled: false,
    taskTypes: ["study", "exam", "lesson"],
  },
  guitar: {
    key: "guitar",
    name: "Gitar Eğitimi",
    color: "#0F766E",
    enabled: false,
    taskTypes: ["guitar", "lesson"],
  },
};

export const TASK_TYPE_LABELS: Record<TaskTypeKey, string> = {
  workout: "Antrenman",
  meal: "Beslenme planı",
  measure: "Ölçüm",
  habit: "Alışkanlık",
  study: "Soru seti",
  exam: "Deneme",
  lesson: "Video ders",
  guitar: "Gitar pratiği",
};
