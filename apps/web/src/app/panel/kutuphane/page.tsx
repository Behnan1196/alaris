import Link from "next/link";
import { Suspense } from "react";
import { requireCoach } from "@/lib/coach";
import { Library, type Exercise } from "./library";

async function Content() {
  const { supabase, userId } = await requireCoach();
  const { data } = await supabase
    .from("exercises")
    .select("id, owner_coach_id, name, muscles, equipment, steps, video_paths")
    .or(`owner_coach_id.is.null,owner_coach_id.eq.${userId}`)
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/panel" className="text-sm text-zinc-500 underline">
          ← Genel bakış
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Hareket kütüphanesi</h1>
        <p className="text-sm text-zinc-500">
          Programda hareket adını yazarken bu listeden seçebilirsin. Videolar danışan uygulamasında hareket ekranında oynar.
        </p>
      </div>
      <Library coachId={userId} exercises={(data ?? []) as unknown as Exercise[]} />
    </div>
  );
}

export default function Page() {
  return (
    <main className="flex-1 bg-zinc-50">
      <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Yükleniyor…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
