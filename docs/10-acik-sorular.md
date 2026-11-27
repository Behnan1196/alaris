# 10. Açık sorular

Cevaplanınca soruyu buradan kaldır, kararı `karar-gunlugu.md` dosyasına ve ilgili belgeye yaz.

## Teknik

1. Barındırma ve verinin yurt içinde tutulması gerekiyor mu? Supabase projesi şu an Seul (ap-northeast-2) bölgesinde; Türkiye'den her sorgu ~200 ms. Öneri (27 Kasım 2026): veri azken projeyi Frankfurt (eu-central-1) bölgesine taşımak ve Vercel fonksiyonlarını fra1'e almak; KVKK açısından da AB daha uygun. Geçici olarak Vercel fonksiyonları Seul'e (icn1) alındı.
2. Video barındırma (hareket videoları, koç yüklemeleri) hangi servisle?

## Ürün

5. Danışan başına koçluk sayısı sınırı olacak mı?
9. Aynı danışanın iki koçu da ölçüm isterse: tek ölçüm kaydı ortak mı kullanılır (rızayla)?
11. Koçların mobil uygulaması olacak mı, yoksa yalnızca web paneli mi (mobil uyumlu)?
12. Koçluk bitince koçun eski danışan verisine erişimi ne olur?
13. Danışanın başka hangi alanlarda koçluk aldığını (yalnızca alan adı) koçun görmesi de rızaya bağlı mı?

## İçerik

22. Hazır hareket video seti: lisanslı kütüphane (ör. MuscleWiki, ExerciseDB; video hakları sözleşmeyle doğrulanmalı) mi, kendi çekimimiz (150–300 temel hareket, kısa iki açılı döngüler) mi, ikisi birden mi? Başka platformların (Everfit, Hubfit) videoları kullanılamaz. Döngüler kendi depomuzda; YouTube yalnızca uzun anlatım ve tanıtım için önerilir.
23. Besin veritabanı kaynağı: USDA FoodData Central (kamu malı, İngilizce), TürKomp (ticari kullanım için TAGEM'den yazılı izin gerekir), barkod için Open Food Facts (ODbL, kaynak gösterilmeli).

## Tasarım

14. Widget arka planları için gerçek fotoğraflar, marka ve logo.
15. Kayıt / giriş, profil, ayarlar, davet kodu ekranları tasarlanacak (davet akışı geliştirmede).

## İş

16. Koç aboneliği fiyatı, deneme süresi, kademeler (danışan sayısına göre?).
17. Ödeme sağlayıcısı.
18. Ücretli danışan katmanının içeriği ve fiyatı.
19. Koçun danışandan ücret tahsil etmesi ileride olacak mı?
20. Ekip / stüdyo hesapları.
21. Reşit olmayan danışanlar ve veli rızası (sınav alanı açılınca).
