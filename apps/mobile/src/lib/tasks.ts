import { localDate, type Json } from '@alaris/shared';

import { supabase } from './supabase';

export type ProgramTask = {
  id: string;
  task_type_key: string;
  title: string;
  payload: Json;
  options: Json;
  client_note: string | null;
  program: { name: string; domain_key: string; coaching_id: string | null } | null;
};

export type Instance = {
  id: string;
  status: 'pending' | 'in_progress' | 'done' | 'missed' | 'skipped';
  progress: Json;
  started_at: string | null;
  completed_at: string | null;
};

export async function loadProgramTask(id: string) {
  const { data, error } = await supabase
    .from('program_tasks')
    .select('id, task_type_key, title, payload, options, client_note, program:programs(name, domain_key, coaching_id)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as ProgramTask;
}

/** Bugünün görev örneği; yoksa null. */
export async function findInstance(programTaskId: string, date = localDate()) {
  const { data, error } = await supabase
    .from('task_instances')
    .select('id, status, progress, started_at, completed_at')
    .eq('program_task_id', programTaskId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data as Instance | null;
}

/** Görev örneğini oluşturur (varsa olanı döndürür). Anlık görüntüyü sunucu doldurur. */
export async function ensureInstance(programTaskId: string, date = localDate()) {
  const existing = await findInstance(programTaskId, date);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('task_instances')
    // Diğer sütunlar sunucudaki tetikleyiciyle doldurulur; tip için yer tutucu değerler.
    .insert({
      program_task_id: programTaskId,
      date,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      client_id: '00000000-0000-0000-0000-000000000000',
      coaching_id: '00000000-0000-0000-0000-000000000000',
      domain_key: 'fitness',
      task_type_key: 'workout',
      title: '-',
    })
    .select('id, status, progress, started_at, completed_at')
    .single();
  if (error) {
    // Aynı anda başka bir cihazdan oluşturulduysa
    const again = await findInstance(programTaskId, date);
    if (again) return again;
    throw error;
  }
  return data as Instance;
}

export async function saveProgress(instanceId: string, progress: unknown, status?: Instance['status']) {
  const patch: { progress: Json; status?: Instance['status']; completed_at?: string | null } = {
    progress: progress as Json,
  };
  if (status) {
    patch.status = status;
    patch.completed_at = status === 'done' ? new Date().toISOString() : null;
  }
  const { error } = await supabase.from('task_instances').update(patch).eq('id', instanceId);
  if (error) throw error;
}

export async function addLog(instanceId: string, kind: string, data: unknown) {
  const { error } = await supabase
    .from('task_logs')
    .insert({ task_instance_id: instanceId, kind, data: data as Json });
  if (error) throw error;
}

/** Bir hareketin önceki antrenmanlardaki son set kayıtları (set sırasına göre). */
export async function previousSets(exerciseName: string, beforeDate = localDate()) {
  const { data } = await supabase
    .from('task_logs')
    .select('data, created_at, task_instances!inner(date)')
    .eq('kind', 'set')
    .eq('data->>exercise_name', exerciseName)
    .lt('task_instances.date', beforeDate)
    .order('created_at', { ascending: false })
    .limit(20);
  if (!data?.length) return [];
  const lastDate = (data[0] as unknown as { task_instances: { date: string } }).task_instances.date;
  return data
    .filter((r) => (r as unknown as { task_instances: { date: string } }).task_instances.date === lastDate)
    .map((r) => r.data as { set_index: number; kg: number | null; reps: number | null })
    .sort((a, b) => a.set_index - b.set_index);
}
