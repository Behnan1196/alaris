"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { translateError } from "@alaris/shared";
import { requireUser } from "@/lib/coach";
import { getT } from "@/lib/i18n";

export type ActionState = { error?: string; code?: string } | undefined;

export async function becomeCoach(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { t } = await getT();
  const domains = formData.getAll("domains").map(String);
  if (domains.length === 0) return { error: t("err.pickDomain") };
  const { error } = await supabase.rpc("become_coach", {
    p_title: String(formData.get("title") ?? ""),
    p_domain_keys: domains,
  });
  if (error) return { error: translateError(error.message, t) };
  redirect("/panel");
}

export async function createInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { t } = await getT();
  const domains = formData.getAll("domains").map(String);
  if (domains.length === 0) return { error: t("web.invite.pickDomain") };
  const { data, error } = await supabase.rpc("create_invite", { p_domain_keys: domains });
  if (error) return { error: translateError(error.message, t) };
  revalidatePath("/panel");
  return { code: data };
}
