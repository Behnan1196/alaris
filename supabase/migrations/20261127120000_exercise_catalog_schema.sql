-- Sistem hareket kütüphanesi için alanlar. İçerik ayrı migration'da (supabase/data/exercises.json'dan üretilir).
alter table public.exercises
  add column key text,
  add column category text,
  add column secondary_muscles text[] not null default '{}',
  add column steps_i18n jsonb not null default '{}'::jsonb,     -- {"tr": [...], "en": [...]}
  add column benefits_i18n jsonb not null default '{}'::jsonb;  -- {"tr": "...", "en": "..."}

-- Sistem hareketlerinin kalıcı anahtarı (koç hareketlerinde boş).
create unique index exercises_system_key on public.exercises (key) where owner_coach_id is null;
