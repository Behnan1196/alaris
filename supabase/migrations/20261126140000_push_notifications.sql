-- Uzaktan bildirimler: cihaz kayıtları ve olay tetikleyicileri.
-- Akış: yeni mesaj / gönderilen program -> tetikleyici -> pg_net ile `notify` Edge Function'ı
-- -> Expo Push API -> telefon. Fonksiyon olayı veritabanından kendisi okur ve aynı olayı
-- bir kez bildirir (notification_log), bu yüzden gizli anahtar gerekmez.

-- pg_net Supabase'de vardır; yoksa (ör. yerel test) tetikleyiciler sessizce bir şey yapmaz.
do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net kurulamadı: %', sqlerrm;
end;
$$;

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
grant select, insert, update, delete on public.push_tokens to authenticated;

create policy "kendi cihazları" on public.push_tokens for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Aynı olayın iki kez bildirilmemesi için; yalnızca sunucu fonksiyonu (service role) yazar.
create table public.notification_log (
  kind text not null,
  ref text not null,
  sent_at timestamptz not null default now(),
  primary key (kind, ref)
);
alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;

-- Uygulama ayarları (gizli değil). functions_url boşsa bildirim tetiklenmez.
create table private.app_config (
  key text primary key,
  value text not null
);
revoke all on private.app_config from public, anon, authenticated;

create function private.notify(p_kind text, p_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  select value into v_url from private.app_config where key = 'functions_url';
  if v_url is null or to_regnamespace('net') is null then
    return;
  end if;
  execute 'select net.http_post(url := $1, body := $2, headers := $3)'
    using v_url || '/notify',
          jsonb_build_object('kind', p_kind, 'ref', p_ref),
          '{"Content-Type": "application/json"}'::jsonb;
exception when others then
  -- Bildirim gönderilemedi diye asıl işlem (mesaj, program) başarısız olmasın.
  raise warning 'bildirim tetiklenemedi: %', sqlerrm;
end;
$$;

create function private.on_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.notify('message', new.id::text);
  return new;
end;
$$;

create trigger messages_notify after insert on public.messages
  for each row execute function private.on_message_insert();

-- Program gönderildiğinde (aktif oldu ya da aktifken yeniden gönderildi).
create function private.on_program_sent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'active'
     and (old.status is distinct from 'active' or old.start_date is distinct from new.start_date
          or old.repeat is distinct from new.repeat) then
    perform private.notify('program', new.id::text || ':' || coalesce(new.start_date::text, ''));
  end if;
  return new;
end;
$$;

create trigger programs_notify after update on public.programs
  for each row execute function private.on_program_sent();

revoke all on function private.notify(text, text) from public, anon, authenticated;
revoke all on function private.on_message_insert() from public, anon, authenticated;
revoke all on function private.on_program_sent() from public, anon, authenticated;

-- Bu projenin fonksiyon adresi (gizli değil).
insert into private.app_config (key, value)
values ('functions_url', 'https://wionwxwflclxtusvfdld.supabase.co/functions/v1')
on conflict (key) do update set value = excluded.value;
