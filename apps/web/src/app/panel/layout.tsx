import { Suspense } from "react";
import { Sidebar, SidebarSkeleton, type CoachSummary } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

async function SidebarWithData() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims?.sub;
  if (!uid) return <Sidebar coach={null} />;

  const [{ data: coach }, { data: profile }, { data: threads }] = await Promise.all([
    supabase.from("coach_profiles").select("title, coach_domains(domain_key)").eq("user_id", uid).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
    supabase.from("threads").select("id").eq("coach_id", uid),
  ]);
  if (!coach) return <Sidebar coach={null} />;

  let unread = 0;
  if (threads?.length) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in(
        "thread_id",
        threads.map((t) => t.id),
      )
      .is("read_at", null)
      .neq("sender_id", uid);
    unread = count ?? 0;
  }

  const summary: CoachSummary = {
    name: profile?.full_name ?? "",
    title: coach.title,
    domainKeys: coach.coach_domains.map((d) => d.domain_key),
    unread,
  };
  return <Sidebar coach={summary} />;
}

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarWithData />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
