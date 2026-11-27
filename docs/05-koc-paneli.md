# 5. Koç paneli (web)

Referans: https://claude.ai/artifact/63CmKZ95QW31jYELEeFw81

## Gezinme

Sol menü: **Genel bakış · Danışanlar · Program oluşturucu · Kütüphane · Mesajlar**. Üstte danışan arama ve "Program oluştur" düğmesi. Koç kartında koçun alanları görünür (ör. "Fitness + Beslenme koçu").

## 5.1 Genel bakış

- KPI kutuları (ör. aktif danışan, haftalık uyum, okunmamış mesaj, yenileme yaklaşan). [VARSAYIM: tam liste netleşmedi]
- **İlgilenmen gerekenler**: kaçırılan görevler, programı olmayan yeni danışan, bitmek üzere olan program, cevap bekleyen soru. Her satırda eylem (Mesaja yanıt ver / Program oluştur / Programı aç / Kayıtları gör).
- **Bugün olanlar**: danışan etkinlik akışı (antrenman bitti, öğün fotoğrafı yükledi, seri ulaştı, ...).
- **Bu hafta uyum**: danışan başına tamamlanan / planlanan görev yüzdesi.

**Uyum (adherence)** = haftada tamamlanan / planlanan (görevler + koçun atadığı alışkanlıklar). Koç, kendi atadığı alışkanlıkları takip eder ve bunlar uyuma dahildir; danışanın kendi alışkanlıkları uyuma girmez. [KARAR]

## 5.2 Danışanlar

- Filtreler (alan, durum) ve tablo: Danışan, Hedef, alan etiketleri, Hafta, Uyum, Son aktivite, Durum (Yolunda / Dikkat / Yenileme yakın / Mesaj bekliyor / Program yok / Ölçüm bekliyor).
- Danışan ayrıntısı: başlık (hedef, hafta, uyum, "Senden aldığı" alanlar), Mesaj ve Programı düzenle düğmeleri. Sekmeler:
  - **Bu hafta**: günlere göre görevler ve durumları (tamam / kaçırıldı / bekliyor), alışkanlık noktaları.
  - **İlerleme**: KPI'lar ve grafik (kilo, ölçü vb.).
  - **Son kayıtlar**: danışanın girdiği kayıtlar (set, fotoğraf, ses kaydı) ve koçun yorumu.
- Yan kartlar: Aktif program, **Başka koçlardan aldığı** (yalnız alan adları; ayrıntı rızaya bağlı), Koç notu (danışan görmez).

## 5.3 Program oluşturucu

- Program adı, danışan seçimi, durum; "Şablon olarak kaydet", "Gönder".
- Seçili danışan için **yalnızca o danışana verilen alanlar** ve alan filtresi. [KARAR]
- **Haftalık takvim**: 7 gün sütunu, her günde görev kartları ve "Görev ekle" menüsü (alanın görev tipleri).
- **Alışkanlık şeridi**: takvimin altında, güne değil haftaya bağlı.
- **Sağ panel (görev düzenleyici)**: gün, alan, tipe özel alanlar, seçenek anahtarları, danışana not ve **"Danışan uygulamasında böyle görünür"** önizlemesi.
- **Gönder penceresi**: danışan(lar), başlangıç tarihi, tekrar (yalnızca 1 hafta / 4 hafta tekrarla / program bitene kadar), danışana bildirim gönder.

Birden çok haftalık programın düzenlenmesi (hafta 1..12 arası geçiş, hafta kopyalama) mockup'ta yok. [AÇIK SORU]

**Uygulama (26 Kasım 2026) [VARSAYIM]:** Koç tek bir haftalık şablon hazırlar. Gönderirken seçilen tekrar biçimi şablonun kaç hafta uygulanacağını belirler: yalnızca 1 hafta, 4 hafta ya da program süresi boyunca. Haftalar, başlangıç gününün bulunduğu haftanın pazartesisinden sayılır. Hareketler kütüphaneden adla seçilir ya da serbest yazılır, video yok; öğünler elle girilir, besin veritabanı yok [KARAR 2026-11-26]. Şablon olarak kaydetme henüz yok.

## 5.4 Kütüphane

- Sekmeler: hareketler (videolu), öğünler / tarifler, şablon programlar, alışkanlıklar, (sonra) ders videoları. "Yeni ekle", "Programa ekle".
- Hazır bir hareket kütüphanesi ile mi başlanacak, yoksa her koç kendi videosunu mu yükleyecek? [AÇIK SORU]

## 5.5 Mesajlar

- Danışan listesi ve sohbet; sağda danışan profili kısayolu, hızlı yanıtlar.
- Ekler: fotoğraf, ses kaydı. [VARSAYIM]

## 5.6 Henüz tasarlanmamış

- Koç kaydı, abonelik ve ödeme sayfası, profil (alanlar, biyografi).
- Davet kodu üretme ve danışan ekleme. [KARAR: geliştirmede tasarlanacak]
- Danışanla ücret / paket yönetimi (koçun danışandan para alması). [AÇIK SORU]
- Bildirimler, mobil uyumlu panel.

## Uygulama durumu (26 Kasım 2026)

- **Genel bakış:** göstergeler (aktif danışan, bu hafta ortalama uyum, bugün tamamlanan görev, ilgilenmen gereken), İlgilenmen gerekenler (bu hafta kaçırılan görevler, gönderilmiş programı olmayan alan, 7 gün içinde biten program), Bugün olanlar (tamamlanan görevler ve ölçümler), danışan tablosunda haftalık uyum çubuğu.
- **Uyum hesabı:** bu haftanın pazartesisinden bugüne kadar planlanan görevler + koçun atadığı alışkanlıklar içinde tamamlananların oranı. "Haftada 3" alışkanlıkta hedef geçen gün sayısıyla sınırlı. Geçmiş günde tamamlanmayan görev "kaçırıldı" sayılır.
- **Danışan sayfası:** alan kartları, Bu hafta (günlere göre görev durumları), İlerleme (ölçüm başına son değer, değişim ve çizgi grafik), koç notu, Son kayıtlar (set, zorluk puanı, öğün), Alışkanlıklar (son 7 gün), Başka koçlardan aldığı.
- Henüz yok: "Mesaja yanıt ver" ve okunmamış mesaj göstergesi (6. adım), filtreler ve arama.
- (7. adım) Kütüphane: sistem ve kendi hareketlerin; yeni hareket, sistem hareketini kopyalayıp düzenleme, video yükleme (en fazla 50 MB). Danışan sayfasında Fotoğraflar ve alan başına "ilerleme yorumu" (danışan İlerleme ekranında görür). Öğün ve şablon kütüphanesi sekmeleri henüz yok.
- (27 Kasım) Program oluşturucu: hafta seçici (1..N), 1. hafta şablon, "Bu haftayı ayrı düzenle", "Bu haftayı kopyala", "1. hafta şablonuna dön"; görevleri sürükleyip başka güne taşıma; antrenmanda "öncekiyle süperset".
- (27 Kasım) Kütüphanede 62 hareketlik sistem kataloğu: kategori filtreleri (Bacak, Kalça, Göğüs, Sırt, Omuz, Kol, Karın, Kondisyon, Kardiyo, Mobilite, Benim hareketlerim), "İncele" panelinde hedef/yardımcı kaslar, yararlar ve adımlar; "Kopyala ve düzenle" ile koç kendi sürümünü oluşturur.
