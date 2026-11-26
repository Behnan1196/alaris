-- Mesajlar: anlık yayın (Realtime) ve okundu işaretleme.

-- Realtime, satır güvenliğine (RLS) uyar: abone yalnızca görebildiği mesajları alır.
alter publication supabase_realtime add table public.messages;

create index messages_unread on public.messages (thread_id) where read_at is null;

-- Sohbetteki karşı tarafın mesajlarını okundu yapar; okunan sayıyı döndürür.
create function public.mark_thread_read(p_thread_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
begin
  if not exists (
    select 1 from public.threads
    where id = p_thread_id and (coach_id = v_uid or client_id = v_uid)
  ) then
    raise exception 'Bu sohbete erişimin yok';
  end if;

  update public.messages
  set read_at = now()
  where thread_id = p_thread_id and sender_id <> v_uid and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_thread_read(uuid) from public, anon;
grant execute on function public.mark_thread_read(uuid) to authenticated;
