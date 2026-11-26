// Kök .env.local dosyasını uygulamalara dağıtır (değerleri ekrana yazmaz).
// - apps/mobile/.env.local : EXPO_PUBLIC_* değişkenleri olduğu gibi
// - apps/web/.env.local    : EXPO_PUBLIC_SUPABASE_* -> NEXT_PUBLIC_SUPABASE_*
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, ".env.local");

if (!existsSync(src)) {
  console.warn("[env:sync] Kökte .env.local yok; .env.example dosyasına bakın.");
  process.exit(0);
}

const vars = {};
for (const line of readFileSync(src, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) vars[m[1]] = m[2];
}

const header = "# Otomatik üretildi: scripts/sync-env.mjs. Düzenlemeyin; kökteki .env.local'ı düzenleyin.\n";
const toFile = (obj) =>
  header + Object.entries(obj).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";

const mobile = Object.fromEntries(
  Object.entries(vars).filter(([k]) => k.startsWith("EXPO_PUBLIC_")),
);
const web = {};
for (const [k, v] of Object.entries(vars)) {
  if (k.startsWith("EXPO_PUBLIC_SUPABASE_")) web[k.replace("EXPO_PUBLIC_", "NEXT_PUBLIC_")] = v;
  else if (k.startsWith("NEXT_PUBLIC_") || k.startsWith("SUPABASE_")) web[k] = v;
}

writeFileSync(resolve(root, "apps/mobile/.env.local"), toFile(mobile));
writeFileSync(resolve(root, "apps/web/.env.local"), toFile(web));
console.log(
  `[env:sync] mobile: ${Object.keys(mobile).join(", ") || "-"} | web: ${Object.keys(web).join(", ") || "-"}`,
);
