// supabase/data/exercises.json -> supabase/migrations/<zaman>_system_exercises.sql
// Kullanım: npm run db:exercises  (sonra npm run db:push)
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { exercises } = JSON.parse(readFileSync(resolve(root, "supabase/data/exercises.json"), "utf8"));

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const arr = (a) => (a.length ? `array[${a.map(q).join(", ")}]::text[]` : "'{}'::text[]");
const json = (o) => `${q(JSON.stringify(o))}::jsonb`;

const keys = new Set();
const rows = exercises.map((e) => {
  if (keys.has(e.key)) throw new Error("Tekrarlanan anahtar: " + e.key);
  keys.add(e.key);
  return `  (${q(e.key)}, ${q(e.name.tr)}, ${json(e.name)}, ${q(e.category)}, ${q(e.equipment)}, ${arr(e.muscles)}, ${arr(e.secondary ?? [])}, ${arr(e.steps.tr)}, ${json(e.steps)}, ${json(e.benefits)})`;
});

const sql = `-- OTOMATİK ÜRETİLDİ: scripts/gen-exercises.mjs (kaynak supabase/data/exercises.json). Elle düzenlemeyin.
-- Sistem hareket kütüphanesi: ${rows.length} hareket. Aynı anahtarlı kayıtlar güncellenir.
insert into public.exercises (key, name, name_i18n, category, equipment, muscles, secondary_muscles, steps, steps_i18n, benefits_i18n)
values
${rows.join(",\n")}
on conflict (key) where owner_coach_id is null do update set
  name = excluded.name,
  name_i18n = excluded.name_i18n,
  category = excluded.category,
  equipment = excluded.equipment,
  muscles = excluded.muscles,
  secondary_muscles = excluded.secondary_muscles,
  steps = excluded.steps,
  steps_i18n = excluded.steps_i18n,
  benefits_i18n = excluded.benefits_i18n;
`;

const dir = resolve(root, "supabase/migrations");
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const out = resolve(dir, `${stamp}_system_exercises.sql`);
writeFileSync(out, sql);
console.log(`${rows.length} hareket -> ${out}`);
