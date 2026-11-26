import { DOMAINS } from "@alaris/shared";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Alaris · Koç paneli</h1>
        <p className="mt-2 text-zinc-600">Geliştirme iskeleti. Ekranlar sırayla eklenecek.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {Object.values(DOMAINS).map((d) => (
          <li
            key={d.key}
            className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}
            </span>
            {!d.enabled && <span className="text-xs text-zinc-500">Yakında</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
