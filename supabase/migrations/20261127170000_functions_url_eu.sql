-- Proje AB bölgesine (eu-west-1) taşındı, 27 Kasım 2026: bildirim fonksiyonunun adresi bu projenin adresi.
insert into private.app_config (key, value)
values ('functions_url', 'https://smfmpedppxomwwhkhlef.supabase.co/functions/v1')
on conflict (key) do update set value = excluded.value;
