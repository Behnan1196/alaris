-- Yerel geliştirme için örnek veri (yalnız `supabase db reset` ile yerelde çalışır).
-- Demo kullanıcılar (koç, danışan) kayıt akışı hazır olunca uygulama üzerinden oluşturulacak.
-- Sistem kütüphanesinin kaynağı henüz açık (docs/10-acik-sorular.md, soru 7); bunlar yer tutucudur.

insert into public.exercises (name, name_i18n, muscles, equipment, steps) values
  ('Squat', '{"tr": "Squat", "en": "Squat"}', '{quadriceps,glutes,hamstrings}', 'Barbell',
   '{"Ayaklar omuz genişliğinde","Kalçayı geriye iterek çömel","Dizler ayak uçlarıyla aynı yönde","Topuklardan iterek kalk"}'),
  ('Bench Press', '{"tr": "Bench Press", "en": "Bench Press"}', '{chest,triceps,front_delts}', 'Barbell',
   '{"Sırt üstü uzan, kürek kemiklerini sıkıştır","Barı göğüs hizasına indir","Kontrollü it"}'),
  ('Romanian Deadlift', '{"tr": "Romanian Deadlift", "en": "Romanian Deadlift"}', '{hamstrings,glutes,lower_back}', 'Barbell',
   '{"Dizler hafif bükük","Kalçadan menteşe hareketi","Sırt düz, bar bacağa yakın"}'),
  ('Plank', '{"tr": "Plank", "en": "Plank"}', '{core}', 'Vücut ağırlığı',
   '{"Dirsekler omuz altında","Vücut düz bir çizgide","Karın sıkı, nefesi tutma"}');

insert into public.foods (name, name_i18n, portion, kcal, protein_g, carb_g, fat_g) values
  ('Yulaf ezmesi', '{"tr": "Yulaf ezmesi", "en": "Oats"}', '50 g', 190, 6.5, 33, 3.5),
  ('Haşlanmış yumurta', '{"tr": "Haşlanmış yumurta", "en": "Boiled egg"}', '1 adet', 78, 6.3, 0.6, 5.3),
  ('Tavuk göğsü (ızgara)', '{"tr": "Tavuk göğsü (ızgara)", "en": "Chicken breast (grilled)"}', '150 g', 248, 46, 0, 5.4),
  ('Bulgur pilavı', '{"tr": "Bulgur pilavı", "en": "Bulgur pilaf"}', '1 porsiyon (150 g)', 230, 7, 42, 4),
  ('Süzme yoğurt', '{"tr": "Süzme yoğurt", "en": "Strained yogurt"}', '200 g', 190, 18, 8, 10);
