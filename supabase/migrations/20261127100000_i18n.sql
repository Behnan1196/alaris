-- Çok dil: hazır içerik için dil başına ad, kayıtta seçilen dil.

-- Sistem kütüphanesindeki hareket ve besinlerin dil başına adı: {"tr": "...", "en": "..."}.
-- Boşsa ya da dil eksikse uygulamalar `name` alanını gösterir.
alter table public.exercises add column name_i18n jsonb not null default '{}'::jsonb;
alter table public.foods add column name_i18n jsonb not null default '{}'::jsonb;

-- Kayıtta seçilen dil profile yazılır (bildirimler bu dilde gönderilir).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kvkk text := nullif(new.raw_user_meta_data ->> 'kvkk_version', '');
  v_locale text := coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'tr');
begin
  if v_locale not in ('tr', 'en') then
    v_locale := 'tr';
  end if;

  insert into public.profiles (id, full_name, locale)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), v_locale);

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

alter table public.profiles add constraint profiles_locale_check check (locale in ('tr', 'en'));
