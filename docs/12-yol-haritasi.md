# 12. Yol haritası (kilometre taşları)

Durum: **öneri** [VARSAYIM], 26 Kasım 2026. Onaylanınca `karar-gunlugu.md` dosyasına yazılır. Kapsam: `09-mvp-kapsami.md`.

| # | Kilometre taşı | İçerik | Bitti sayılır |
|---|---|---|---|
| 0 | İskelet ✓ | Monorepo, Next.js + Expo + ortak paket, Supabase klasörü, ortam değişkenleri | `typecheck`, `lint`, web derlemesi ve mobil paketleme geçiyor |
| 1 | Veri modeli ve güvenlik | `06-veri-modeli.md` taslağından ilk migration: kullanıcı profilleri, alanlar, görev tipleri, koçluk, davet, program, görev, alışkanlık, ölçüm, rıza. RLS politikaları (koçlar arası görünürlük dahil), örnek veri (Deniz, Can), Supabase'den TypeScript tipleri | RLS testleri: bir koç başka koçun danışan verisini rızasız göremiyor |
| 2 | Kimlik ve bağlanma | Koç kaydı/girişi (web), danışan kaydı/girişi (mobil), KVKK aydınlatma ve rıza, koçun alan seçimi, davet kodu üretme ve kodla bağlanma | Koç davet kodu üretir, danışan kodla bağlanır, iki tarafta da görünür |
| 3 | Program oluşturucu (koç) | Haftalık takvim, Antrenman / Beslenme planı / Ölçüm / Alışkanlık düzenleyicileri, hareket ve öğün kütüphanesi (ilk hali), gönderme, şablon | Koç bir danışana 1 haftalık Fitness + Beslenme programı gönderir |
| 4 | Danışan günlük akışı (mobil) | Koçluklarım widget'ları, alan ayrıntısı, antrenman akışı (set tablosu, dinlenme sayacı), beslenme günü (makrolar, "Yedim", fotoğraf), ölçüm girişi, Alışkanlıklarım | Danışan bugünün işini bitirir, koç panelinde görünür |
| 5 | Koç takibi | Genel bakış (ilgilenmen gerekenler, akış, uyum), danışan ayrıntısı (Bu hafta, İlerleme, Son kayıtlar, koç notu) | Uyum ve kaçırılan görevler doğru hesaplanıyor |
| 6 | Mesajlar ve bildirimler | Koç başına sohbet (Realtime), bildirimler (yeni program, mesaj, alışkanlık hatırlatması) | Mesaj iki yönlü anlık gidiyor, bildirim geliyor |
| 7 | İlerleme ve medya | İlerleme ekranları ve grafikler, hareket videoları, öğün ve ölçüm fotoğrafları (imzalı bağlantılar) | Kilo grafiği ve fotoğraflar iki tarafta görünüyor |
| 8 | Abonelik ve yayın hazırlığı | Koç aboneliği ve ödeme, EAS derlemeleri, gizlilik metinleri, hata izleme | TestFlight / iç test dağıtımı |

## Kilometre taşlarından önce cevaplanması iyi olanlar

- 1 öncesi: alan başına program mı (açık soru 4), uyuma alışkanlık dahil mi (6), Supabase bölgesi ve KVKK (1).
- 3 öncesi: hazır hareket kütüphanesi mi (7), besin veritabanı gerekli mi (8).
- 8 öncesi: ödeme sağlayıcısı ve fiyat (16, 17).
