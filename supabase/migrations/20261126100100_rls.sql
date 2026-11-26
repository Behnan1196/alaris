-- Alaris erişim kuralları (Row Level Security). Kaynak: docs/08-gizlilik-kvkk.md
-- İlke: bir koç yalnızca kendi koçluklarının verisini görür. Başka bir koçun
-- koçluğundaki veriyi yalnızca danışan 'cross_coach_share' rızası verdiyse görür.

-- ---------------------------------------------------------------------------
-- Yardımcı fonksiyonlar (security definer: politikalarda özyinelemeyi önler)
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Çağıran bu koçluğun koçu mu?
create function private.is_coach_of_coaching(p_coaching_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.coachings
    where id = p_coaching_id and coach_id = (select auth.uid())
  );
$$;

-- Çağıran bu koçluğun danışanı mı?
create function private.is_client_of_coaching(p_coaching_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.coachings
    where id = p_coaching_id and client_id = (select auth.uid())
  );
$$;

-- Çağıran bu danışanın açık (bitmemiş) bir koçluğunun koçu mu?
create function private.is_coach_of_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.coachings
    where client_id = p_client_id and coach_id = (select auth.uid()) and status <> 'ended'
  );
$$;

-- Çağıran ile kullanıcı arasında herhangi bir koçluk var mı (iki yönde)?
create function private.has_coaching_with(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.coachings
    where (coach_id = (select auth.uid()) and client_id = p_user_id)
       or (client_id = (select auth.uid()) and coach_id = p_user_id)
  );
$$;

-- Çağıran bu koçluğun verisini görebilir mi?
-- Taraflar (koç, danışan) görür. Başka bir koç yalnızca geçerli rızayla ve
-- danışanla açık bir koçluğu varken görür.
-- Not: Koçluk bitince koçun erişimi şimdilik sürüyor (docs/10-acik-sorular.md, soru 12).
create function private.can_view_coaching(p_coaching_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.coachings c
    where c.id = p_coaching_id
      and (
        c.coach_id = (select auth.uid())
        or c.client_id = (select auth.uid())
        or (
          exists (
            select 1 from public.consents s
            where s.type = 'cross_coach_share'
              and s.client_id = c.client_id
              and s.source_coaching_id = c.id
              and s.grantee_coach_id = (select auth.uid())
              and s.revoked_at is null
          )
          and exists (
            select 1 from public.coachings mine
            where mine.client_id = c.client_id
              and mine.coach_id = (select auth.uid())
              and mine.status <> 'ended'
          )
        )
      )
  );
$$;

create function private.coaching_client(p_coaching_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select client_id from public.coachings where id = p_coaching_id;
$$;

-- Program görevi canlı (aktif programda) ve çağıranın kendi görevi mi?
create function private.is_live_task_of_caller(p_program_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.program_tasks pt
    join public.programs p on p.id = pt.program_id
    join public.coachings c on c.id = p.coaching_id
    where pt.id = p_program_task_id
      and p.status = 'active'
      and c.status = 'active'
      and c.client_id = (select auth.uid())
  );
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Yetkiler: anon yalnızca sabit tabloları okur; gerisi RLS ile authenticated
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.domains, public.task_types, public.domain_task_types to anon;

alter table public.domains enable row level security;
alter table public.task_types enable row level security;
alter table public.domain_task_types enable row level security;
alter table public.profiles enable row level security;
alter table public.client_profiles enable row level security;
alter table public.coach_profiles enable row level security;
alter table public.coach_domains enable row level security;
alter table public.coachings enable row level security;
alter table public.coaching_domains enable row level security;
alter table public.coaching_notes enable row level security;
alter table public.invites enable row level security;
alter table public.programs enable row level security;
alter table public.program_tasks enable row level security;
alter table public.task_instances enable row level security;
alter table public.task_logs enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.exercises enable row level security;
alter table public.foods enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.consents enable row level security;
alter table public.subscriptions enable row level security;

-- Sabit tablolar ---------------------------------------------------------------
create policy "herkes okur" on public.domains for select to anon, authenticated using (true);
create policy "herkes okur" on public.task_types for select to anon, authenticated using (true);
create policy "herkes okur" on public.domain_task_types for select to anon, authenticated using (true);

-- Profiller -------------------------------------------------------------------
create policy "kendi veya koçluk tarafı okur" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.has_coaching_with(id));
create policy "kendini günceller" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "kendi veya koçu okur" on public.client_profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.is_coach_of_client(user_id));
create policy "kendisi ekler" on public.client_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "kendisi günceller" on public.client_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "kendi veya danışanı okur" on public.coach_profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.has_coaching_with(user_id));
create policy "kendisi ekler" on public.coach_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "kendisi günceller" on public.coach_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "kendi veya danışanı okur" on public.coach_domains for select to authenticated
  using (coach_id = (select auth.uid()) or private.has_coaching_with(coach_id));
create policy "kendisi ekler" on public.coach_domains for insert to authenticated
  with check (coach_id = (select auth.uid()));
create policy "kendisi siler" on public.coach_domains for delete to authenticated
  using (coach_id = (select auth.uid()));

-- Koçluklar -------------------------------------------------------------------
-- Ekleme yalnızca redeem_invite() ile.
create policy "taraflar okur" on public.coachings for select to authenticated
  using (coach_id = (select auth.uid()) or client_id = (select auth.uid()));
create policy "koç günceller" on public.coachings for update to authenticated
  using (coach_id = (select auth.uid())) with check (coach_id = (select auth.uid()));

create policy "taraflar okur" on public.coaching_domains for select to authenticated
  using (private.is_coach_of_coaching(coaching_id) or private.is_client_of_coaching(coaching_id));
create policy "koç ekler" on public.coaching_domains for insert to authenticated
  with check (private.is_coach_of_coaching(coaching_id));
create policy "koç siler" on public.coaching_domains for delete to authenticated
  using (private.is_coach_of_coaching(coaching_id));

create policy "yalnız koç" on public.coaching_notes for all to authenticated
  using (private.is_coach_of_coaching(coaching_id))
  with check (private.is_coach_of_coaching(coaching_id));

create policy "yalnız koç" on public.invites for all to authenticated
  using (coach_id = (select auth.uid())) with check (coach_id = (select auth.uid()));

-- Programlar ------------------------------------------------------------------
create policy "koç kendi programlarını yönetir" on public.programs for all to authenticated
  using (coach_id = (select auth.uid())) with check (coach_id = (select auth.uid()));
create policy "danışan ve rızalı koç gönderilmişi okur" on public.programs for select to authenticated
  using (coaching_id is not null and status <> 'draft' and private.can_view_coaching(coaching_id));

create policy "program görenler okur" on public.program_tasks for select to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id));
create policy "koç yazar" on public.program_tasks for insert to authenticated
  with check (exists (select 1 from public.programs p where p.id = program_id and p.coach_id = (select auth.uid())));
create policy "koç günceller" on public.program_tasks for update to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id and p.coach_id = (select auth.uid())))
  with check (exists (select 1 from public.programs p where p.id = program_id and p.coach_id = (select auth.uid())));
create policy "koç siler" on public.program_tasks for delete to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id and p.coach_id = (select auth.uid())));

-- Görev örnekleri ve kayıtlar ---------------------------------------------------
create policy "görebilenler okur" on public.task_instances for select to authenticated
  using (private.can_view_coaching(coaching_id));
create policy "danışan canlı görevden oluşturur" on public.task_instances for insert to authenticated
  with check (client_id = (select auth.uid()) and private.is_live_task_of_caller(program_task_id));
create policy "danışan günceller" on public.task_instances for update to authenticated
  using (client_id = (select auth.uid())) with check (client_id = (select auth.uid()));

create policy "görebilenler okur" on public.task_logs for select to authenticated
  using (exists (select 1 from public.task_instances ti where ti.id = task_instance_id));
create policy "danışan yazar" on public.task_logs for insert to authenticated
  with check (exists (select 1 from public.task_instances ti
                      where ti.id = task_instance_id and ti.client_id = (select auth.uid())));
create policy "danışan siler" on public.task_logs for delete to authenticated
  using (exists (select 1 from public.task_instances ti
                 where ti.id = task_instance_id and ti.client_id = (select auth.uid())));

-- Alışkanlıklar ---------------------------------------------------------------
create policy "danışan, koçu ve görünür kıldıklarını koçlar okur" on public.habits for select to authenticated
  using (
    client_id = (select auth.uid())
    or (coaching_id is not null and private.can_view_coaching(coaching_id))
    or (coaching_id is null and visible_to_coaches and private.is_coach_of_client(client_id))
  );
create policy "danışan kendisininkini, koç atadığını ekler" on public.habits for insert to authenticated
  with check (
    (coaching_id is null and client_id = (select auth.uid()))
    or (private.is_coach_of_coaching(coaching_id) and client_id = private.coaching_client(coaching_id))
  );
create policy "danışan kendisininkini, koç atadığını günceller" on public.habits for update to authenticated
  using (
    (coaching_id is null and client_id = (select auth.uid()))
    or private.is_coach_of_coaching(coaching_id)
  )
  with check (
    (coaching_id is null and client_id = (select auth.uid()))
    or (private.is_coach_of_coaching(coaching_id) and client_id = private.coaching_client(coaching_id))
  );
create policy "danışan kendisininkini, koç atadığını siler" on public.habits for delete to authenticated
  using (
    (coaching_id is null and client_id = (select auth.uid()))
    or private.is_coach_of_coaching(coaching_id)
  );

create policy "alışkanlığı görenler okur" on public.habit_logs for select to authenticated
  using (exists (select 1 from public.habits h where h.id = habit_id));
create policy "danışan yazar" on public.habit_logs for insert to authenticated
  with check (exists (select 1 from public.habits h where h.id = habit_id and h.client_id = (select auth.uid())));
create policy "danışan günceller" on public.habit_logs for update to authenticated
  using (exists (select 1 from public.habits h where h.id = habit_id and h.client_id = (select auth.uid())))
  with check (exists (select 1 from public.habits h where h.id = habit_id and h.client_id = (select auth.uid())));
create policy "danışan siler" on public.habit_logs for delete to authenticated
  using (exists (select 1 from public.habits h where h.id = habit_id and h.client_id = (select auth.uid())));

-- Ölçümler --------------------------------------------------------------------
create policy "danışan ve görebilen koç okur" on public.measurements for select to authenticated
  using (
    client_id = (select auth.uid())
    or (coaching_id is not null and private.can_view_coaching(coaching_id))
  );
create policy "danışan yazar" on public.measurements for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and (coaching_id is null or private.is_client_of_coaching(coaching_id))
  );
create policy "danışan günceller" on public.measurements for update to authenticated
  using (client_id = (select auth.uid()))
  with check (
    client_id = (select auth.uid())
    and (coaching_id is null or private.is_client_of_coaching(coaching_id))
  );
create policy "danışan siler" on public.measurements for delete to authenticated
  using (client_id = (select auth.uid()));

-- Kütüphane -------------------------------------------------------------------
create policy "sistem, kendi ve koçunun kütüphanesi" on public.exercises for select to authenticated
  using (owner_coach_id is null or owner_coach_id = (select auth.uid()) or private.has_coaching_with(owner_coach_id));
create policy "koç yazar" on public.exercises for insert to authenticated
  with check (owner_coach_id = (select auth.uid()));
create policy "koç günceller" on public.exercises for update to authenticated
  using (owner_coach_id = (select auth.uid())) with check (owner_coach_id = (select auth.uid()));
create policy "koç siler" on public.exercises for delete to authenticated
  using (owner_coach_id = (select auth.uid()));

create policy "sistem, kendi ve koçunun kütüphanesi" on public.foods for select to authenticated
  using (owner_coach_id is null or owner_coach_id = (select auth.uid()) or private.has_coaching_with(owner_coach_id));
create policy "koç yazar" on public.foods for insert to authenticated
  with check (owner_coach_id = (select auth.uid()));
create policy "koç günceller" on public.foods for update to authenticated
  using (owner_coach_id = (select auth.uid())) with check (owner_coach_id = (select auth.uid()));
create policy "koç siler" on public.foods for delete to authenticated
  using (owner_coach_id = (select auth.uid()));

-- Mesajlar --------------------------------------------------------------------
-- Sohbet redeem_invite() ile açılır.
create policy "taraflar okur" on public.threads for select to authenticated
  using (coach_id = (select auth.uid()) or client_id = (select auth.uid()));

create policy "taraflar okur" on public.messages for select to authenticated
  using (exists (select 1 from public.threads t where t.id = thread_id));
create policy "taraf kendi adına yazar" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and exists (select 1 from public.threads t where t.id = thread_id));
-- Alıcı okundu işaretler. (Sütun kısıtı ileride bir RPC ile daraltılabilir.)
create policy "alıcı günceller" on public.messages for update to authenticated
  using (sender_id <> (select auth.uid()) and exists (select 1 from public.threads t where t.id = thread_id))
  with check (sender_id <> (select auth.uid()) and exists (select 1 from public.threads t where t.id = thread_id));

-- Rızalar ---------------------------------------------------------------------
create policy "danışan ve ilgili koç okur" on public.consents for select to authenticated
  using (
    client_id = (select auth.uid())
    or grantee_coach_id = (select auth.uid())
    or (coaching_id is not null and private.is_coach_of_coaching(coaching_id))
  );
create policy "danışan verir" on public.consents for insert to authenticated
  with check (client_id = (select auth.uid()));
create policy "danışan geri alır" on public.consents for update to authenticated
  using (client_id = (select auth.uid())) with check (client_id = (select auth.uid()));

-- Abonelik --------------------------------------------------------------------
create policy "koç kendisininkini okur" on public.subscriptions for select to authenticated
  using (coach_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RPC'ler
-- ---------------------------------------------------------------------------

-- Koç davet kodu üretir (8 karakter, karışması kolay harfler yok).
create function public.create_invite(p_domain_keys text[])
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if not exists (select 1 from public.coach_profiles where user_id = (select auth.uid())) then
    raise exception 'Yalnızca koçlar davet oluşturabilir';
  end if;
  if exists (
    select 1 from unnest(p_domain_keys) k
    where not exists (select 1 from public.coach_domains
                      where coach_id = (select auth.uid()) and domain_key = k)
  ) then
    raise exception 'Davet yalnızca koçun kendi alanlarını içerebilir';
  end if;

  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;

  insert into public.invites (code, coach_id, domain_keys)
  values (v_code, (select auth.uid()), p_domain_keys);
  return v_code;
end;
$$;

-- Danışan, kabul etmeden önce davetin kimden ve hangi alanlarda olduğunu görür.
create function public.invite_preview(p_code text)
returns table (coach_name text, coach_title text, domain_keys text[], expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name, cp.title, i.domain_keys, i.expires_at
  from public.invites i
  join public.coach_profiles cp on cp.user_id = i.coach_id
  join public.profiles p on p.id = i.coach_id
  where i.code = upper(trim(p_code))
    and i.used_at is null
    and i.expires_at > now();
$$;

-- Danışan davet kodunu kullanır: koçluk, alanlar, sohbet ve "koçla veri paylaşımı" rızası oluşur.
create function public.redeem_invite(p_code text, p_consent_version text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite public.invites;
  v_coaching_id uuid;
begin
  if v_uid is null then
    raise exception 'Giriş gerekli';
  end if;

  select * into v_invite from public.invites
  where code = upper(trim(p_code))
  for update;

  if not found or v_invite.used_at is not null or v_invite.expires_at <= now() then
    raise exception 'Davet kodu geçersiz veya süresi dolmuş';
  end if;
  if v_invite.coach_id = v_uid then
    raise exception 'Kendi davet kodunuzu kullanamazsınız';
  end if;

  insert into public.client_profiles (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  select id into v_coaching_id from public.coachings
  where coach_id = v_invite.coach_id and client_id = v_uid and status <> 'ended';

  if v_coaching_id is null then
    insert into public.coachings (coach_id, client_id, status)
    values (v_invite.coach_id, v_uid, 'active')
    returning id into v_coaching_id;
  end if;

  insert into public.coaching_domains (coaching_id, domain_key)
  select v_coaching_id, k from unnest(v_invite.domain_keys) k
  on conflict do nothing;

  insert into public.threads (coach_id, client_id)
  values (v_invite.coach_id, v_uid)
  on conflict (coach_id, client_id) do nothing;

  insert into public.consents (client_id, type, coaching_id, text_version)
  values (v_uid, 'share_with_coach', v_coaching_id, p_consent_version);

  update public.invites
  set used_by = v_uid, used_at = now(), coaching_id = v_coaching_id
  where id = v_invite.id;

  return v_coaching_id;
end;
$$;

-- Koç, danışanın başka koçlardan aldığı alanların yalnızca adını görür
-- ("Başka koçlardan aldığı" kartı). Bunun da rızaya bağlanıp bağlanmayacağı açık soru (13).
create function public.client_other_domains(p_client_id uuid)
returns table (domain_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct cd.domain_key
  from public.coachings c
  join public.coaching_domains cd on cd.coaching_id = c.id
  where c.client_id = p_client_id
    and c.status <> 'ended'
    and c.coach_id <> (select auth.uid())
    and private.is_coach_of_client(p_client_id);
$$;

revoke all on function public.create_invite(text[]) from public, anon;
revoke all on function public.invite_preview(text) from public, anon;
revoke all on function public.redeem_invite(text, text) from public, anon;
revoke all on function public.client_other_domains(uuid) from public, anon;
grant execute on function public.create_invite(text[]) to authenticated;
grant execute on function public.invite_preview(text) to authenticated;
grant execute on function public.redeem_invite(text, text) to authenticated;
grant execute on function public.client_other_domains(uuid) to authenticated;

-- Trigger fonksiyonları doğrudan çağrılamasın
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.fill_task_instance_snapshot() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Bütünlük: güncellemede değişmemesi gereken sütunlar
-- (RLS satırı kimin güncelleyebileceğini belirler; hangi sütunun değişebileceğini bunlar)
-- ---------------------------------------------------------------------------

create function private.guard_coachings_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.coach_id <> old.coach_id or new.client_id <> old.client_id then
    raise exception 'Koçluğun tarafları değiştirilemez';
  end if;
  return new;
end;
$$;
create trigger coachings_guard before update on public.coachings
  for each row execute function private.guard_coachings_update();

create function private.guard_task_instances_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.program_task_id, new.program_id, new.coaching_id, new.client_id, new.domain_key,
      new.task_type_key, new.title, new.payload, new.date)
     is distinct from
     (old.program_task_id, old.program_id, old.coaching_id, old.client_id, old.domain_key,
      old.task_type_key, old.title, old.payload, old.date)
     and current_user = 'authenticated' then
    raise exception 'Görevin yalnızca durumu ve ilerlemesi değiştirilebilir';
  end if;
  return new;
end;
$$;
create trigger task_instances_guard before update on public.task_instances
  for each row execute function private.guard_task_instances_update();

create function private.guard_messages_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.thread_id, new.sender_id, new.body, new.attachments, new.related_task_instance_id, new.created_at)
     is distinct from
     (old.thread_id, old.sender_id, old.body, old.attachments, old.related_task_instance_id, old.created_at) then
    raise exception 'Mesajda yalnızca okundu bilgisi değiştirilebilir';
  end if;
  return new;
end;
$$;
create trigger messages_guard before update on public.messages
  for each row execute function private.guard_messages_update();

create function private.guard_consents_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.client_id, new.type, new.coaching_id, new.grantee_coach_id, new.source_coaching_id,
      new.text_version, new.granted_at)
     is distinct from
     (old.client_id, old.type, old.coaching_id, old.grantee_coach_id, old.source_coaching_id,
      old.text_version, old.granted_at)
     or old.revoked_at is not null then
    raise exception 'Rıza kaydı değiştirilemez; yalnızca bir kez geri alınabilir';
  end if;
  return new;
end;
$$;
create trigger consents_guard before update on public.consents
  for each row execute function private.guard_consents_update();

create function private.guard_habit_logs_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.habit_id <> old.habit_id then
    raise exception 'Kaydın alışkanlığı değiştirilemez';
  end if;
  return new;
end;
$$;
create trigger habit_logs_guard before update on public.habit_logs
  for each row execute function private.guard_habit_logs_update();

create function private.guard_task_logs_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Görev kaydı güncellenemez; silip yeniden ekleyin';
end;
$$;
create trigger task_logs_guard before update on public.task_logs
  for each row execute function private.guard_task_logs_update();

-- Danışan, koçun atadığı alışkanlıkta yalnızca (izin verildiyse) hedefi değiştirebilir.
create function public.set_habit_target(p_habit_id uuid, p_target numeric)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.habits
  set target = p_target
  where id = p_habit_id
    and client_id = (select auth.uid())
    and (coaching_id is null or client_can_edit_target);
  if not found then
    raise exception 'Bu alışkanlığın hedefi değiştirilemez';
  end if;
end;
$$;
revoke all on function public.set_habit_target(uuid, numeric) from public, anon;
grant execute on function public.set_habit_target(uuid, numeric) to authenticated;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;
