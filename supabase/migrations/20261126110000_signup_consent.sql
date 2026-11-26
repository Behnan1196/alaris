-- Kayıtta verilen KVKK açık rızası, kayıt metadata'sından (kvkk_version) kaydedilir.
-- E-posta onayı açıkken kayıttan hemen sonra oturum olmadığı için rıza istemciden yazılamaz.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kvkk text := nullif(new.raw_user_meta_data ->> 'kvkk_version', '');
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if v_kvkk is not null then
    insert into public.consents (client_id, type, text_version)
    values (new.id, 'kvkk', v_kvkk);
  end if;

  if (new.raw_user_meta_data ->> 'marketing_opt_in')::boolean is true then
    insert into public.consents (client_id, type, text_version)
    values (new.id, 'marketing', coalesce(v_kvkk, 'unknown'));
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Koç olma: profil ve alanlar tek işlemde.
create function public.become_coach(p_title text, p_domain_keys text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Giriş gerekli';
  end if;
  if coalesce(cardinality(p_domain_keys), 0) = 0 then
    raise exception 'En az bir alan seçin';
  end if;
  if exists (
    select 1 from unnest(p_domain_keys) k
    where not exists (select 1 from public.domains d where d.key = k and d.enabled)
  ) then
    raise exception 'Bu alan henüz kullanılamıyor';
  end if;

  insert into public.coach_profiles (user_id, title)
  values (v_uid, nullif(trim(p_title), ''))
  on conflict (user_id) do update set title = excluded.title;

  delete from public.coach_domains
  where coach_id = v_uid and domain_key <> all (p_domain_keys);

  insert into public.coach_domains (coach_id, domain_key)
  select v_uid, k from unnest(p_domain_keys) k
  on conflict do nothing;
end;
$$;

revoke all on function public.become_coach(text, text[]) from public, anon;
grant execute on function public.become_coach(text, text[]) to authenticated;
