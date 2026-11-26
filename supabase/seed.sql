-- Yerel geliştirme için örnek veri (yalnız `supabase db reset` ile yerelde çalışır).
-- Demo kullanıcılar (koç, danışan) kayıt akışı hazır olunca uygulama üzerinden oluşturulacak.
-- Sistem kütüphanesinin kaynağı henüz açık (docs/10-acik-sorular.md, soru 7); bunlar yer tutucudur.

insert into public.exercises (name, muscles, equipment, steps) values
  ('Squat', '{quadriceps,glutes,hamstrings}', 'Barbell',
   '{"Ayaklar omuz genişliğinde","Kalçayı geriye iterek çömel","Dizler ayak uçlarıyla aynı yönde","Topuklardan iterek kalk"}'),
  ('Bench Press', '{chest,triceps,front_delts}', 'Barbell',
   '{"Sırt üstü uzan, kürek kemiklerini sıkıştır","Barı göğüs hizasına indir","Kontrollü it"}'),
  ('Romanian Deadlift', '{hamstrings,glutes,lower_back}', 'Barbell',
   '{"Dizler hafif bükük","Kalçadan menteşe hareketi","Sırt düz, bar bacağa yakın"}'),
  ('Plank', '{core}', 'Vücut ağırlığı',
   '{"Dirsekler omuz altında","Vücut düz bir çizgide","Karın sıkı, nefesi tutma"}');

insert into public.foods (name, portion, kcal, protein_g, carb_g, fat_g) values
  ('Yulaf ezmesi', '50 g', 190, 6.5, 33, 3.5),
  ('Haşlanmış yumurta', '1 adet', 78, 6.3, 0.6, 5.3),
  ('Tavuk göğsü (ızgara)', '150 g', 248, 46, 0, 5.4),
  ('Bulgur pilavı', '1 porsiyon (150 g)', 230, 7, 42, 4),
  ('Süzme yoğurt', '200 g', 190, 18, 8, 10);
