"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/coach";

export type ActionState = { error?: string; code?: string } | undefined;

export async function becomeCoach(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const domains = formData.getAll("domains").map(String);
  if (domains.length === 0) return { error: "En az bir alan seç." };
  const { error } = await supabase.rpc("become_coach", {
    p_title: String(formData.get("title") ?? ""),
    p_domain_keys: domains,
  });
  if (error) return { error: error.message };
  redirect("/panel");
}

export async function createInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const domains = formData.getAll("domains").map(String);
  if (domains.length === 0) return { error: "Davete en az bir alan ekle." };
  const { data, error } = await supabase.rpc("create_invite", { p_domain_keys: domains });
  if (error) return { error: error.message };
  revalidatePath("/panel");
  return { code: data };
}
