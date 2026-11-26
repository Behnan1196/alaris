"use server";

import type { Json, ProgramRepeat } from "@alaris/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/coach";

export type Result = { error?: string; ok?: boolean };

function builderPath(coachingId: string, domain: string) {
  return `/panel/danisan/${coachingId}/program/${domain}`;
}

export async function createProgram(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const coachingId = String(formData.get("coaching_id"));
  const domain = String(formData.get("domain_key"));
  const name = String(formData.get("name") ?? "").trim() || "Yeni program";
  const weeks = Math.max(1, Math.min(52, Number(formData.get("weeks")) || 4));
  const { error } = await supabase.from("programs").insert({
    coach_id: userId,
    coaching_id: coachingId,
    domain_key: domain,
    name,
    weeks,
    status: "draft",
  });
  if (error) throw new Error(error.message);
  redirect(builderPath(coachingId, domain));
}

export type TaskInput = {
  id?: string;
  program_id: string;
  day_of_week: number;
  task_type_key: string;
  title: string;
  payload: Json;
  options: Json;
  client_note: string | null;
};

export async function saveTask(input: TaskInput, path: string): Promise<Result & { id?: string }> {
  const { supabase } = await requireUser();
  const row = {
    program_id: input.program_id,
    day_of_week: input.day_of_week,
    task_type_key: input.task_type_key,
    title: input.title.trim() || "Görev",
    payload: input.payload,
    options: input.options,
    client_note: input.client_note?.trim() || null,
  };
  const res = input.id
    ? await supabase.from("program_tasks").update(row).eq("id", input.id).select("id").single()
    : await supabase.from("program_tasks").insert(row).select("id").single();
  if (res.error) return { error: res.error.message };
  revalidatePath(path);
  return { ok: true, id: res.data.id };
}

export async function deleteTask(id: string, path: string): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("program_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(path);
  return { ok: true };
}

export async function copyTask(id: string, dayOfWeek: number, path: string): Promise<Result> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("program_tasks")
    .select("program_id, task_type_key, title, payload, options, client_note")
    .eq("id", id)
    .single();
  if (error) return { error: error.message };
  const ins = await supabase.from("program_tasks").insert({ ...data, day_of_week: dayOfWeek });
  if (ins.error) return { error: ins.error.message };
  revalidatePath(path);
  return { ok: true };
}

export type HabitInput = {
  id?: string;
  coaching_id: string;
  client_id: string;
  program_id: string;
  domain_key: string;
  title: string;
  frequency: "daily" | "weekdays" | "three_per_week";
  target: number | null;
  unit: string | null;
  reminder_time: string | null;
  client_can_edit_target: boolean;
  show_streak: boolean;
};

export async function saveHabit(input: HabitInput, path: string): Promise<Result> {
  const { supabase } = await requireUser();
  const { id, ...rest } = input;
  const row = {
    ...rest,
    title: rest.title.trim() || "Alışkanlık",
    unit: rest.unit?.trim() || null,
    reminder_time: rest.reminder_time || null,
  };
  const res = id
    ? await supabase.from("habits").update(row).eq("id", id)
    : await supabase.from("habits").insert(row);
  if (res.error) return { error: res.error.message };
  revalidatePath(path);
  return { ok: true };
}

export async function deleteHabit(id: string, path: string): Promise<Result> {
  const { supabase } = await requireUser();
  // Geçmiş kayıtlar kalsın diye silmek yerine pasifleştirilir.
  const { error } = await supabase.from("habits").update({ active: false }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(path);
  return { ok: true };
}

export async function updateProgramMeta(
  programId: string,
  meta: { name: string; weeks: number },
  path: string,
): Promise<Result> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("programs")
    .update({ name: meta.name.trim() || "Program", weeks: Math.max(1, Math.min(52, meta.weeks)) })
    .eq("id", programId);
  if (error) return { error: error.message };
  revalidatePath(path);
  return { ok: true };
}

/** Programı danışana gönderir: aynı alandaki önceki aktif program tamamlanmış sayılır. */
export async function sendProgram(
  input: { programId: string; coachingId: string; domain: string; startDate: string; repeat: ProgramRepeat },
  path: string,
): Promise<Result> {
  const { supabase } = await requireUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) return { error: "Başlangıç tarihi seç." };

  const { count } = await supabase
    .from("program_tasks")
    .select("id", { count: "exact", head: true })
    .eq("program_id", input.programId);
  if (!count) return { error: "Göndermeden önce en az bir görev ekle." };

  const prev = await supabase
    .from("programs")
    .update({ status: "completed" })
    .eq("coaching_id", input.coachingId)
    .eq("domain_key", input.domain)
    .eq("status", "active")
    .neq("id", input.programId);
  if (prev.error) return { error: prev.error.message };

  const { error } = await supabase
    .from("programs")
    .update({ status: "active", start_date: input.startDate, repeat: input.repeat })
    .eq("id", input.programId);
  if (error) return { error: error.message };
  revalidatePath(path);
  revalidatePath("/panel");
  return { ok: true };
}
