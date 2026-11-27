import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Giriş yapmış kullanıcıyı ve koç profilini döndürür; koç değilse kuruluma yönlendirir. */
export async function requireCoach() {
  const { supabase, userId } = await requireUser();
  // İki sorgu paralel: her gidiş-dönüş, sunucu ile veritabanı arasındaki uzaklık kadar sürer.
  const [{ data: coach }, { data: profile }] = await Promise.all([
    supabase.from("coach_profiles").select("user_id, title, coach_domains(domain_key)").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  if (!coach) redirect("/panel/kurulum");

  return {
    supabase,
    userId,
    name: profile?.full_name ?? "",
    title: coach.title,
    domainKeys: coach.coach_domains.map((d) => d.domain_key),
  };
}

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/giris");
  return { supabase, userId };
}
