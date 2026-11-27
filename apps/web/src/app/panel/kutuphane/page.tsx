import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/ui";
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
    <PageBody>
      <PageHeader crumb="Kütüphane" title="Hareketler" />
      <p className="-mt-3 text-sm text-muted">
        Programda hareket adını yazarken bu listeden seçebilirsin. Videolar danışan uygulamasında hareket ekranında oynar.
      </p>
      <Library coachId={userId} exercises={(data ?? []) as unknown as Exercise[]} />
    </PageBody>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-muted">Yükleniyor…</p>}>
      <Content />
    </Suspense>
  );
}
