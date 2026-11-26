# 5. Koç paneli (web)

Referans: https://claude.ai/artifact/63CmKZ95QW31jYELEeFw81

## Gezinme

Sol menü: **Genel bakış · Danışanlar · Program oluşturucu · Kütüphane · Mesajlar**. Üstte danışan arama ve "Program oluştur" düğmesi. Koç kartında koçun alanları görünür (ör. "Fitness + Beslenme koçu").

## 5.1 Genel bakış

- KPI kutuları (ör. aktif danışan, haftalık uyum, okunmamış mesaj, yenileme yaklaşan). [VARSAYIM: tam liste netleşmedi]
- **İlgilenmen gerekenler**: kaçırılan görevler, programı olmayan yeni danışan, bitmek üzere olan program, cevap bekleyen soru. Her satırda eylem (Mesaja yanıt ver / Program oluştur / Programı aç / Kayıtları gör).
- **Bugün olanlar**: danışan etkinlik akışı (antrenman bitti, öğün fotoğrafı yükledi, seri ulaştı, ...).
- **Bu hafta uyum**: danışan başına tamamlanan / planlanan görev yüzdesi.

**Uyum (adherence)** = haftada tamamlanan görev / planlanan görev. Alışkanlıklar dahil mi? [AÇIK SORU]

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
