-- Yerel geliştirme için örnek veri (yalnız `supabase db reset` ile yerelde çalışır).
-- Demo kullanıcılar (koç, danışan) kayıt akışı hazır olunca uygulama üzerinden oluşturulacak.
-- Sistem kütüphanesinin kaynağı henüz açık (docs/10-acik-sorular.md, soru 7); bunlar yer tutucudur.

-- Sistem hareketleri migration ile gelir (supabase/data/exercises.json).

insert into public.foods (name, name_i18n, portion, kcal, protein_g, carb_g, fat_g) values
  ('Yulaf ezmesi', '{"tr": "Yulaf ezmesi", "en": "Oats"}', '50 g', 190, 6.5, 33, 3.5),
  ('Haşlanmış yumurta', '{"tr": "Haşlanmış yumurta", "en": "Boiled egg"}', '1 adet', 78, 6.3, 0.6, 5.3),
  ('Tavuk göğsü (ızgara)', '{"tr": "Tavuk göğsü (ızgara)", "en": "Chicken breast (grilled)"}', '150 g', 248, 46, 0, 5.4),
  ('Bulgur pilavı', '{"tr": "Bulgur pilavı", "en": "Bulgur pilaf"}', '1 porsiyon (150 g)', 230, 7, 42, 4),
  ('Süzme yoğurt', '{"tr": "Süzme yoğurt", "en": "Strained yogurt"}', '200 g', 190, 18, 8, 10);
