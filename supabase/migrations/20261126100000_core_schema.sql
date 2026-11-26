-- Alaris çekirdek şeması. Kaynak: docs/06-veri-modeli.md, docs/03-alanlar-ve-gorevler.md
-- Erişim kuralları ayrı migration'da (RLS).

-- ---------------------------------------------------------------------------
-- Sabit tablolar: alanlar ve görev tipleri
-- ---------------------------------------------------------------------------

create table public.domains (
  key text primary key,
  name text not null,
  color text not null,
  sort_order smallint not null default 0,
  enabled boolean not null default false
);

create table public.task_types (
  key text primary key,
  name text not null,
  -- Tipe özel alanların tanımı; yeni alan eklemek şema değişikliği gerektirmesin.
  schema jsonb not null default '{}'::jsonb,
  is_habit boolean not null default false
);

create table public.domain_task_types (
  domain_key text not null references public.domains (key) on delete cascade,
  task_type_key text not null references public.task_types (key) on delete cascade,
  primary key (domain_key, task_type_key)
);

insert into public.domains (key, name, color, sort_order, enabled) values
  ('fitness',   'Fitness',        '#C2410C', 1, true),
  ('nutrition', 'Beslenme',       '#4D7C0F', 2, true),
  ('exam',      'Sınav Koçluğu',  '#1D4ED8', 3, false),
  ('guitar',    'Gitar Eğitimi',  '#0F766E', 4, false);

insert into public.task_types (key, name, is_habit) values
  ('workout', 'Antrenman',      false),
  ('meal',    'Beslenme planı', false),
  ('measure', 'Ölçüm',          false),
  ('habit',   'Alışkanlık',     true),
  ('study',   'Soru seti',      false),
  ('exam',    'Deneme',         false),
  ('lesson',  'Video ders',     false),
  ('guitar',  'Gitar pratiği',  false);

insert into public.domain_task_types (domain_key, task_type_key) values
  ('fitness', 'workout'), ('fitness', 'measure'), ('fitness', 'habit'),
  ('nutrition', 'meal'), ('nutrition', 'measure'), ('nutrition', 'habit'),
  ('exam', 'study'), ('exam', 'exam'), ('exam', 'lesson'), ('exam', 'habit'),
  ('guitar', 'guitar'), ('guitar', 'lesson'), ('guitar', 'habit');

-- ---------------------------------------------------------------------------
-- Kullanıcılar
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  locale text not null default 'tr',
  created_at timestamptz not null default now()
);

create table public.client_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date,
  goals text,
  created_at timestamptz not null default now()
);

create table public.coach_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  title text,            -- ör. "Dyt."
  bio text,
  photo_path text,
  created_at timestamptz not null default now()
);

-- Koçun hizmet verdiği alanlar
create table public.coach_domains (
  coach_id uuid not null references public.coach_profiles (user_id) on delete cascade,
  domain_key text not null references public.domains (key),
  primary key (coach_id, domain_key)
);

-- Yeni auth kullanıcısı için profil satırı
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Koçluk ilişkisi
-- ---------------------------------------------------------------------------

create type public.coaching_status as enum ('invited', 'active', 'paused', 'ended');

create table public.coachings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles (user_id),
  client_id uuid not null references public.profiles (id),
  status public.coaching_status not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (coach_id <> client_id)
);

-- Aynı koç ile danışan arasında aynı anda tek açık koçluk
create unique index coachings_one_open_per_pair
  on public.coachings (coach_id, client_id)
  where status <> 'ended';

-- Bu danışana verilen alanlar (koçun alanlarının alt kümesi)
create table public.coaching_domains (
  coaching_id uuid not null references public.coachings (id) on delete cascade,
  domain_key text not null references public.domains (key),
  primary key (coaching_id, domain_key)
);

create function public.check_coaching_domain_subset()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.coachings c
    join public.coach_domains cd on cd.coach_id = c.coach_id
    where c.id = new.coaching_id and cd.domain_key = new.domain_key
  ) then
    raise exception 'Koç bu alanda hizmet vermiyor: %', new.domain_key;
  end if;
  return new;
end;
$$;

create trigger coaching_domains_subset
  before insert or update on public.coaching_domains
  for each row execute function public.check_coaching_domain_subset();

-- Koçun danışanla ilgili özel notu (danışan görmez; bu yüzden ayrı tablo)
create table public.coaching_notes (
  coaching_id uuid primary key references public.coachings (id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now()
);

-- Davet kodu
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  coach_id uuid not null references public.coach_profiles (user_id) on delete cascade,
  domain_keys text[] not null check (cardinality(domain_keys) > 0),
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references public.profiles (id),
  used_at timestamptz,
  coaching_id uuid references public.coachings (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Programlar ve görevler
-- ---------------------------------------------------------------------------

create type public.program_repeat as enum ('once', 'four_weeks', 'until_end');
create type public.program_status as enum ('draft', 'active', 'completed', 'archived');

-- Program alan başına [KARAR 2026-11-26]. Şablonlar koçluğa bağlı değildir.
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles (user_id),
  coaching_id uuid references public.coachings (id) on delete cascade,
  domain_key text not null references public.domains (key),
  name text not null,
  weeks smallint not null default 1 check (weeks between 1 and 52),
  start_date date,
  repeat public.program_repeat not null default 'once',
  status public.program_status not null default 'draft',
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_template or coaching_id is not null),
  check (not is_template or coaching_id is null)
);

-- Bir danışanın bir alanda aynı anda tek aktif programı [VARSAYIM]
create unique index programs_one_active_per_domain
  on public.programs (coaching_id, domain_key)
  where status = 'active';

create function public.check_program_coaching()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.coaching_id is not null and not exists (
    select 1 from public.coaching_domains cd
    join public.coachings c on c.id = cd.coaching_id
    where cd.coaching_id = new.coaching_id
      and cd.domain_key = new.domain_key
      and c.coach_id = new.coach_id
  ) then
    raise exception 'Bu alan bu koçluğa verilmemiş: %', new.domain_key;
  end if;
  return new;
end;
$$;

create trigger programs_check_coaching
  before insert or update on public.programs
  for each row execute function public.check_program_coaching();

create table public.program_tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  week_no smallint not null default 1 check (week_no >= 1),
  day_of_week smallint not null check (day_of_week between 1 and 7), -- 1 = Pazartesi
  task_type_key text not null references public.task_types (key),
  title text not null,
  payload jsonb not null default '{}'::jsonb,   -- tipe özel alanlar
  options jsonb not null default '{}'::jsonb,   -- seçenek anahtarları
  client_note text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index program_tasks_program on public.program_tasks (program_id, week_no, day_of_week);

create function public.check_program_task_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.programs p
    join public.domain_task_types dtt on dtt.domain_key = p.domain_key
    join public.task_types tt on tt.key = dtt.task_type_key
    where p.id = new.program_id
      and dtt.task_type_key = new.task_type_key
      and not tt.is_habit
  ) then
    raise exception 'Görev tipi bu alanda kullanılamaz: %', new.task_type_key;
  end if;
  return new;
end;
$$;

create trigger program_tasks_check_type
  before insert or update on public.program_tasks
  for each row execute function public.check_program_task_type();

-- Danışanın belirli bir gündeki görevi. Program değişse de geçmiş korunur:
-- görevin o anki hali (anlık görüntü) burada saklanır.
create type public.task_status as enum ('pending', 'in_progress', 'done', 'missed', 'skipped');

create table public.task_instances (
  id uuid primary key default gen_random_uuid(),
  program_task_id uuid references public.program_tasks (id) on delete set null,
  program_id uuid references public.programs (id) on delete set null,
  coaching_id uuid not null references public.coachings (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  domain_key text not null references public.domains (key),
  task_type_key text not null references public.task_types (key),
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  date date not null,
  status public.task_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  progress jsonb not null default '{}'::jsonb,  -- kaldığı yer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_task_id, date)
);

create index task_instances_client_date on public.task_instances (client_id, date);
create index task_instances_coaching_date on public.task_instances (coaching_id, date);

-- Görev örneği yalnızca program görevinden türetilir; anlık görüntüyü sunucu doldurur.
create function public.fill_task_instance_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t record;
begin
  select pt.title, pt.payload, pt.task_type_key, p.id as program_id, p.domain_key,
         p.coaching_id, c.client_id
    into t
  from public.program_tasks pt
  join public.programs p on p.id = pt.program_id
  join public.coachings c on c.id = p.coaching_id
  where pt.id = new.program_task_id;

  if not found then
    raise exception 'Program görevi bulunamadı';
  end if;

  new.title := t.title;
  new.payload := t.payload;
  new.task_type_key := t.task_type_key;
  new.program_id := t.program_id;
  new.domain_key := t.domain_key;
  new.coaching_id := t.coaching_id;
  new.client_id := t.client_id;
  return new;
end;
$$;

create trigger task_instances_snapshot
  before insert on public.task_instances
  for each row execute function public.fill_task_instance_snapshot();

-- Görev kayıtları: set kaydı, öğün işareti, fotoğraf vb.
create table public.task_logs (
  id uuid primary key default gen_random_uuid(),
  task_instance_id uuid not null references public.task_instances (id) on delete cascade,
  kind text not null,          -- ör. set, meal_eaten, meal_photo, meal_alternative, rpe
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index task_logs_instance on public.task_logs (task_instance_id);

-- ---------------------------------------------------------------------------
-- Alışkanlıklar
-- ---------------------------------------------------------------------------

create type public.habit_frequency as enum ('daily', 'weekdays', 'three_per_week');

-- coaching_id dolu: koçun atadığı alışkanlık (uyuma dahil [KARAR 2026-11-26]).
-- coaching_id boş: danışanın kendi alışkanlığı (uyuma dahil değil).
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  coaching_id uuid references public.coachings (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  domain_key text references public.domains (key),
  title text not null,
  frequency public.habit_frequency not null default 'daily',
  target numeric,              -- ör. 8 (bardak), 10000 (adım); boşsa tek dokunuş
  unit text,
  reminder_time time,
  client_can_edit_target boolean not null default false,
  show_streak boolean not null default true,
  visible_to_coaches boolean not null default false, -- yalnız danışanın kendi alışkanlığında anlamlı
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (coaching_id is not null or program_id is null)
);

create index habits_client on public.habits (client_id) where active;

create table public.habit_logs (
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  value numeric not null default 1,
  updated_at timestamptz not null default now(),
  primary key (habit_id, date)
);

-- ---------------------------------------------------------------------------
-- Ölçümler
-- ---------------------------------------------------------------------------

create type public.measurement_metric as enum ('weight', 'waist', 'hip', 'body_fat');

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  coaching_id uuid references public.coachings (id) on delete set null,
  task_instance_id uuid references public.task_instances (id) on delete set null,
  measured_on date not null default current_date,
  metric public.measurement_metric not null,
  value numeric not null check (value > 0),
  created_at timestamptz not null default now()
);

create index measurements_client on public.measurements (client_id, metric, measured_on);

-- ---------------------------------------------------------------------------
-- Kütüphane
-- ---------------------------------------------------------------------------

-- owner_coach_id boş: sistem kütüphanesi
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_coach_id uuid references public.coach_profiles (user_id) on delete cascade,
  name text not null,
  muscles text[] not null default '{}',
  equipment text,
  steps text[] not null default '{}',
  video_paths jsonb not null default '{}'::jsonb, -- açıya göre: {"front": "...", "side": "..."}
  created_at timestamptz not null default now()
);

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  owner_coach_id uuid references public.coach_profiles (user_id) on delete cascade,
  name text not null,
  portion text,
  kcal numeric,
  protein_g numeric,
  carb_g numeric,
  fat_g numeric,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Mesajlar: koç başına tek sohbet [KARAR]
-- ---------------------------------------------------------------------------

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles (user_id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coach_id, client_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  related_task_instance_id uuid references public.task_instances (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_thread on public.messages (thread_id, created_at);

-- ---------------------------------------------------------------------------
-- Rıza (KVKK) ve abonelik
-- ---------------------------------------------------------------------------

create type public.consent_type as enum ('kvkk', 'health_data', 'share_with_coach', 'cross_coach_share', 'marketing');

-- cross_coach_share: grantee_coach_id, source_coaching_id koçluğunun verisini görebilir.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  type public.consent_type not null,
  coaching_id uuid references public.coachings (id) on delete cascade,
  grantee_coach_id uuid references public.coach_profiles (user_id) on delete cascade,
  source_coaching_id uuid references public.coachings (id) on delete cascade,
  text_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (type <> 'cross_coach_share' or (grantee_coach_id is not null and source_coaching_id is not null))
);

create index consents_client on public.consents (client_id, type) where revoked_at is null;

create type public.subscription_plan as enum ('monthly', 'yearly');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');

-- Yalnızca sunucu (ödeme sağlayıcı webhook'u) yazar.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles (user_id) on delete cascade,
  plan public.subscription_plan not null,
  status public.subscription_status not null,
  current_period_end timestamptz,
  provider text,
  provider_ref text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger programs_touch before update on public.programs
  for each row execute function public.touch_updated_at();
create trigger task_instances_touch before update on public.task_instances
  for each row execute function public.touch_updated_at();
create trigger habit_logs_touch before update on public.habit_logs
  for each row execute function public.touch_updated_at();
