import { Suspense } from "react";
import { T } from "@/components/t";
import { Loading, PageBody, PageHeader } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { Library, type Exercise } from "./library";

async function Content() {
  const { supabase, userId } = await requireCoach();
  const { data } = await supabase
    .from("exercises")
    .select("id, owner_coach_id, key, category, name, name_i18n, muscles, secondary_muscles, equipment, steps, steps_i18n, benefits_i18n, video_paths")
    .or(`owner_coach_id.is.null,owner_coach_id.eq.${userId}`)
    .order("name");

  return (
    <PageBody>
      <PageHeader crumb={<T k="nav.library" />} title={<T k="e.exercises" />} />
      <p className="-mt-3 text-sm text-muted">
        <T k="lib.hint" />
      </p>
      <Library coachId={userId} exercises={(data ?? []) as unknown as Exercise[]} />
    </PageBody>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}
