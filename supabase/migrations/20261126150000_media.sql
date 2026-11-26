-- Medya: gizli depo (Storage), fotoğraf kayıtları, koçun ilerleme yorumu.
-- Dosya yolları:
--   <client_id>/<coaching_id>/<uuid>.jpg   danışanın bir koçluğa ait fotoğrafı (öğün, ölçüm)
--   <client_id>/self/<uuid>.jpg            danışanın koçluğa bağlı olmayan fotoğrafı
--   exercises/<coach_id>/<uuid>.<ext>      koçun hareket videosu
-- Dosyalar herkese açık değildir; uygulamalar süreli imzalı bağlantı (signed URL) kullanır.

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

-- Klasör yolundaki koçluk kimliği güvenli biçimde uuid'e çevrilir.
create function private.try_uuid(p text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

create policy "medya: danışan kendi klasörünü okur ve yazar" on storage.objects for all to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (
      (storage.foldername(name))[2] = 'self'
      or private.is_client_of_coaching(private.try_uuid((storage.foldername(name))[2]))
    )
  );

create policy "medya: koç, görebildiği koçluğun fotoğraflarını okur" on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and private.can_view_coaching(private.try_uuid((storage.foldername(name))[2]))
  );

create policy "medya: koç kendi hareket videolarını yönetir" on storage.objects for all to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'exercises'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'exercises'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "medya: danışan koçunun hareket videolarını izler" on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'exercises'
    and private.has_coaching_with(private.try_uuid((storage.foldername(name))[2]))
  );

-- Fotoğraf kayıtları
create type public.photo_kind as enum ('meal', 'front', 'side', 'other');

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  coaching_id uuid references public.coachings (id) on delete set null,
  task_instance_id uuid references public.task_instances (id) on delete set null,
  kind public.photo_kind not null,
  path text not null unique,
  meta jsonb not null default '{}'::jsonb, -- ör. {"meal_index": 1, "meal_name": "Öğle"}
  taken_on date not null default current_date,
  created_at timestamptz not null default now(),
  check (path like client_id::text || '/%')
);

create index photos_client on public.photos (client_id, taken_on);
create index photos_coaching on public.photos (coaching_id, taken_on);

alter table public.photos enable row level security;
grant select, insert, update, delete on public.photos to authenticated;

create policy "danışan ve görebilen koç okur" on public.photos for select to authenticated
  using (client_id = (select auth.uid()) or (coaching_id is not null and private.can_view_coaching(coaching_id)));
create policy "danışan ekler" on public.photos for insert to authenticated
  with check (client_id = (select auth.uid()) and (coaching_id is null or private.is_client_of_coaching(coaching_id)));
create policy "danışan siler" on public.photos for delete to authenticated
  using (client_id = (select auth.uid()));

-- Koçun alan başına ilerleme yorumu (danışan İlerleme ekranında görür)
create table public.progress_comments (
  coaching_id uuid not null references public.coachings (id) on delete cascade,
  domain_key text not null references public.domains (key),
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (coaching_id, domain_key)
);

alter table public.progress_comments enable row level security;
grant select, insert, update, delete on public.progress_comments to authenticated;

create policy "taraflar okur" on public.progress_comments for select to authenticated
  using (private.is_coach_of_coaching(coaching_id) or private.is_client_of_coaching(coaching_id));
create policy "koç yazar" on public.progress_comments for all to authenticated
  using (private.is_coach_of_coaching(coaching_id))
  with check (private.is_coach_of_coaching(coaching_id));

revoke all on function private.try_uuid(text) from public;
grant execute on function private.try_uuid(text) to authenticated;
